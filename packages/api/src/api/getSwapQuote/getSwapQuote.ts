import {
  RelaySwapMultiInputRequestBody,
  RelayGetQuoteResponseBody,
  GetSwapQuoteRequestBody,
  TRPCErrorMessage,
  getERC20TokenBalance,
  SwapOutput,
  SwapInput,
  Token,
  CrossChainSwapStep,
  GetSwapQuoteReturnType,
} from '@raylac/shared';
import { ed, logger, st } from '@raylac/shared-backend';
import { relayApi } from '../../lib/relay';
import { formatUnits, zeroAddress } from 'viem';
import axios from 'axios';
import { getETHBalance } from '../getTokenBalances/getTokenBalances';
import { TRPCError } from '@trpc/server';
import { getTokenAddressOnChain } from '../../utils';
import { getNonce } from '../../utils';

/**
 * Builds the swap inputs and outputs
 */
const buildSwapIo = ({
  inputToken,
  outputToken,
  amount,
  inputTokenBalance,
}: {
  inputToken: Token;
  outputToken: Token;
  amount: bigint;
  inputTokenBalance: {
    chainId: number;
    balance: bigint;
  }[];
}): {
  inputs: SwapInput[];
  output: SwapOutput;
} => {
  let remainingAmount = amount;

  const inputs: SwapInput[] = [];

  for (const breakdown of inputTokenBalance) {
    const balance = breakdown.balance;

    if (balance === BigInt(0)) {
      continue;
    }

    if (remainingAmount < balance) {
      inputs.push({
        token: inputToken,
        amount: remainingAmount,
        chainId: breakdown.chainId,
      });

      remainingAmount = 0n;
      break;
    } else {
      inputs.push({
        token: inputToken,
        amount: balance,
        chainId: breakdown.chainId,
      });

      remainingAmount = remainingAmount - balance;
    }
  }

  if (remainingAmount > 0n) {
    throw new Error(
      `Not enough balance for ${inputToken.symbol}, required ${amount}, remaining ${remainingAmount}`
    );
  }

  if (inputs.length === 0) {
    throw new Error('Could not create inputs');
  }

  // The output chain should be the chain with the largest input amount
  const bestOutputChain = inputs.sort((a, b) =>
    a.amount < b.amount ? 1 : -1
  )[0].chainId;

  if (!bestOutputChain) {
    throw new Error('Could not determine output chain');
  }

  const possibleOutputChainIds = outputToken.addresses.map(
    address => address.chainId
  );

  const outputChainId = possibleOutputChainIds.find(
    chainId => chainId === bestOutputChain
  )
    ? bestOutputChain
    : // If the output token doesn't exist on the input chains, just use the first one
      possibleOutputChainIds[0];

  const output = outputToken.addresses.find(
    address => address.chainId === outputChainId
  );

  if (!output) {
    throw new Error('Could not determine output');
  }

  return {
    inputs,
    output: {
      token: outputToken,
      chainId: outputChainId,
    },
  };
};

const getSwapQuote = async ({
  sender,
  amount,
  inputToken,
  outputToken,
}: GetSwapQuoteRequestBody): Promise<GetSwapQuoteReturnType> => {
  const balances = await Promise.all(
    inputToken.addresses.map(async ({ chainId, address }) => {
      const balance =
        address === zeroAddress
          ? await getETHBalance({ address: sender, chainId })
          : await getERC20TokenBalance({
              address: sender,
              contractAddress: address,
              chainId,
            });

      return {
        chainId,
        balance,
      };
    })
  );

  const swapIo = buildSwapIo({
    inputToken,
    outputToken,
    amount: BigInt(amount),
    inputTokenBalance: balances,
  });

  const { inputs, output } = swapIo;

  const origins: RelaySwapMultiInputRequestBody['origins'] = inputs.map(
    input => ({
      chainId: input.chainId,
      currency: getTokenAddressOnChain(input.token, input.chainId),
      amount: input.amount.toString(),
    })
  );

  const destinationCurrency = getTokenAddressOnChain(
    outputToken,
    output.chainId
  );

  // Get quote from Relay
  // Get quote from Relay
  const requestBody: RelaySwapMultiInputRequestBody = {
    user: sender,
    recipient: sender,
    origins,
    destinationCurrency,
    destinationChainId: output.chainId,
    partial: false,
    tradeType: 'EXACT_INPUT',
    useUserOperation: false,
  };

  const qt = st('Get quote');

  let quote;
  try {
    const { data } = await relayApi.post<RelayGetQuoteResponseBody>(
      '/execute/swap/multi-input',
      requestBody
    );
    quote = data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message?.includes('amount is too small')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: TRPCErrorMessage.SWAP_AMOUNT_TOO_SMALL,
          cause: error,
        });
      }

      if (
        error.response?.data?.message?.includes(
          'No routes found for the requested swap'
        )
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: TRPCErrorMessage.SWAP_NO_ROUTES_FOUND,
          cause: error,
        });
      }

      if (
        error.response?.data?.message?.includes(
          'Solver has insufficient liquidity for this swap'
        )
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: TRPCErrorMessage.SWAP_INSUFFICIENT_LIQUIDITY,
          cause: error,
        });
      }

      logger.error('Relay API error:', error.response?.data || error.message);
    }
    throw error;
  }

  ed(qt);

  const nonces: Record<number, number> = {};

  const chains = [
    ...new Set([...inputs.map(input => input.chainId), output.chainId]),
  ];

  for (const chainId of chains) {
    nonces[chainId] = await getNonce({
      chainId,
      address: sender,
    });
  }

  const swapSteps: CrossChainSwapStep[] = quote.steps.map(step => {
    if (step.items.length !== 1) {
      throw new Error('Expected 1 step item, got ' + step.items.length);
    }

    const item = step.items[0];

    const crossChainSwapStep: CrossChainSwapStep = {
      originChainId: item.data.chainId,
      destinationChainId: item.data.chainId,
      id: step.id as 'swap' | 'approve',
      tx: {
        data: item.data.data,
        to: item.data.to,
        value: item.data.value,
        maxFeePerGas: item.data.maxFeePerGas,
        maxPriorityFeePerGas: item.data.maxPriorityFeePerGas,
        chainId: item.data.chainId,
        gas: item.data.gas ?? 300_000,
        nonce: nonces[item.data.chainId],
      },
    };

    nonces[item.data.chainId]++;

    return crossChainSwapStep;
  });

  const amountIn = amount;
  const amountOut = quote.details.currencyOut.amount;

  const amountInFormatted = formatUnits(BigInt(amountIn), inputToken.decimals);
  const amountOutFormatted = formatUnits(
    BigInt(amountOut),
    outputToken.decimals
  );

  const amountInUsd = quote.details.currencyIn.amountUsd;
  const amountOutUsd = quote.details.currencyOut.amountUsd;

  const relayerServiceFeeAmount = quote.fees.relayerService.amount;
  const relayerServiceFeeUsd = quote.fees.relayerService.amountUsd;

  if (relayerServiceFeeAmount === undefined) {
    throw new Error('relayerServiceFeeAmount ');
  }

  if (relayerServiceFeeUsd === undefined) {
    throw new Error('relayerServiceFeeUsd is undefined');
  }

  return {
    inputs,
    output,
    swapSteps,
    relayerServiceFeeAmount: relayerServiceFeeAmount.toString(),
    relayerServiceFeeUsd: relayerServiceFeeUsd.toString(),
    amountIn,
    amountOut,
    amountInFormatted,
    amountOutFormatted,
    amountInUsd,
    amountOutUsd,
  };
};

export default getSwapQuote;
