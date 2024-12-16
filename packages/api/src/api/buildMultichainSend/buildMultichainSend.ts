import {
  getPublicClient,
  getWalletClient,
  BuildMultiChainSendRequestBody,
  ERC20Abi,
  BridgeStep,
  TransferStep,
  getERC20TokenBalance,
  getGasInfo,
  supportedChains,
  Token,
  BuildMultiChainSendReturnType,
  formatAmount,
} from '@raylac/shared';
import { getETHBalance } from '../getTokenBalances/getTokenBalances';
import { encodeFunctionData, formatUnits, Hex, zeroAddress } from 'viem';
import {
  convertViemChainToRelayChain,
  Execute,
  getClient,
} from '@reservoir0x/relay-sdk';
import { createClient, MAINNET_RELAY_API } from '@reservoir0x/relay-sdk';
import { getTokenAddressOnChain } from '../../utils';
import getTokenPrice from '../getTokenPrice/getTokenPrice';
import BigNumber from 'bignumber.js';
import { logger } from '@raylac/shared-backend';

createClient({
  baseApiUrl: MAINNET_RELAY_API,
  source: 'raylac.com',
  chains: supportedChains.map(convertViemChainToRelayChain),
});

const getNonce = async ({
  chainId,
  address,
}: {
  chainId: number;
  address: Hex;
}) => {
  const publicClient = getPublicClient({
    chainId,
  });

  return await publicClient.getTransactionCount({
    address,
  });
};

const chooseBridgeInputs = async ({
  sender,
  token,
  tokenBalance,
  amount,
  destinationChainId,
}: {
  sender: Hex;
  token: Token;
  tokenBalance: {
    balance: bigint;
    chainId: number;
  }[];
  amount: bigint;
  destinationChainId: number;
}) => {
  const relayClient = await getClient();

  const balanceOnDestinationChain =
    tokenBalance.find(b => b.chainId === destinationChainId)?.balance || 0n;

  if (balanceOnDestinationChain >= amount) {
    // We don't need to bridge anything
    return [];
  }

  const bridgeSteps: BridgeStep[] = [];

  let remainingAmount = amount - balanceOnDestinationChain;

  for (const chainBalance of tokenBalance.sort((a, b) =>
    b.balance < a.balance ? -1 : 1
  )) {
    if (chainBalance.chainId === destinationChainId) {
      continue;
    }

    if (chainBalance.balance === BigInt(0)) {
      continue;
    }

    const walletClient = await getWalletClient({
      chainId: chainBalance.chainId,
    });

    const fromTokenAddress = getTokenAddressOnChain(
      token,
      chainBalance.chainId
    );
    const toTokenAddress = getTokenAddressOnChain(token, destinationChainId);

    let bridgeQuote: Execute;

    if (remainingAmount < chainBalance.balance) {
      bridgeQuote = await relayClient.actions.getQuote({
        chainId: chainBalance.chainId,
        toChainId: destinationChainId,
        currency: fromTokenAddress,
        toCurrency: toTokenAddress,
        amount: remainingAmount.toString(),
        recipient: sender,
        // @ts-expect-error
        wallet: walletClient,
        tradeType: 'EXACT_OUTPUT',
      });

      const amountInput = bridgeQuote.details?.currencyIn?.amount;

      if (!amountInput) {
        throw new Error('No amount input found');
      }

      if (BigInt(amountInput) > chainBalance.balance) {
        logger.info(
          `Fee exceeds balance ${chainBalance.balance}, input + fee ${amountInput}`
        );
        // There is not enough balance to pay for the bridge quote
        // We need to bridge the entire balance from this chain and bridge from another chain
        // to cover the remaining amount

        bridgeQuote = await relayClient.actions.getQuote({
          chainId: chainBalance.chainId,
          toChainId: destinationChainId,
          currency: fromTokenAddress,
          toCurrency: toTokenAddress,
          amount: chainBalance.balance.toString(),
          recipient: sender,
          // @ts-expect-error
          wallet: walletClient,
          tradeType: 'EXACT_INPUT',
        });
      }
    } else {
      bridgeQuote = await relayClient.actions.getQuote({
        chainId: chainBalance.chainId,
        toChainId: destinationChainId,
        currency: fromTokenAddress,
        toCurrency: toTokenAddress,
        amount: chainBalance.balance.toString(),
        recipient: sender,
        // @ts-expect-error
        wallet: walletClient,
        tradeType: 'EXACT_INPUT',
      });
    }

    if (bridgeQuote.steps.length !== 1) {
      throw new Error(
        `Expected 1 bridge step, got ${bridgeQuote.steps.length}`
      );
    }

    if (bridgeQuote.steps[0]?.items?.length !== 1) {
      throw new Error(
        `Expected 1 bridge step item, got ${bridgeQuote.steps[0]?.items?.length}`
      );
    }

    const bridgeStepItem = bridgeQuote.steps[0]?.items[0];

    if (!bridgeStepItem) {
      throw new Error('No bridge step item found');
    }

    const nonce = await getNonce({
      chainId: chainBalance.chainId,
      address: sender,
    });

    const relayerFee = bridgeQuote.fees?.relayer;

    if (!relayerFee) {
      throw new Error('relayerFee is undefined');
    }

    if (relayerFee.amount === undefined) {
      throw new Error('relayerFee.amount is undefined');
    }

    if (relayerFee.amountFormatted === undefined) {
      throw new Error('relayerFee.amountFormatted is undefined');
    }

    if (relayerFee.amountUsd === undefined) {
      throw new Error('relayerFee.amountUsd is undefined');
    }

    const bridgeFee = relayerFee.amount;
    const bridgeFeeFormatted = relayerFee.amountFormatted;
    const bridgeFeeUsd = relayerFee.amountUsd;

    const amountIn = bridgeQuote.details?.currencyIn?.amount;

    if (!amountIn) {
      throw new Error('amountIn is undefined');
    }

    const amountInFormatted = formatAmount(amountIn.toString(), token.decimals);

    const amountOut = bridgeQuote.details?.currencyOut?.amount;

    if (!amountOut) {
      throw new Error('amountOut is undefined');
    }

    const amountOutFormatted = formatAmount(
      amountOut.toString(),
      token.decimals
    );

    const bridgeStep: BridgeStep = {
      tx: {
        to: bridgeStepItem.data.to,
        data: bridgeStepItem.data.data,
        value: bridgeStepItem.data.value,
        maxFeePerGas: bridgeStepItem.data.maxFeePerGas,
        maxPriorityFeePerGas: bridgeStepItem.data.maxPriorityFeePerGas,
        nonce,
        chainId: chainBalance.chainId,
        gas: 500_0000,
      },
      bridgeDetails: {
        to: sender,
        amountIn: amountIn.toString(),
        amountOut: amountOut.toString(),
        amountInFormatted,
        amountOutFormatted,
        bridgeFee,
        bridgeFeeFormatted,
        bridgeFeeUsd,
        fromChainId: chainBalance.chainId,
        toChainId: destinationChainId,
      },
      serializedTx: '0x',
    };

    bridgeSteps.push(bridgeStep);

    remainingAmount -= BigInt(amountOut);

    if (remainingAmount === 0n) {
      break;
    }

    if (remainingAmount < 0n) {
      throw new Error(
        `Remaining amount is negative, required ${amount}, remaining ${remainingAmount}`
      );
    }
  }

  if (remainingAmount > 0n) {
    throw new Error(
      `Not enough balance, required ${amount}, remaining ${remainingAmount}`
    );
  }

  return bridgeSteps;
};

const buildERC20TransferExecutionStep = ({
  token,
  amount,
  to,
  chainId,
  maxFeePerGas,
  maxPriorityFeePerGas,
  nonce,
}: {
  token: Token;
  amount: bigint;
  to: Hex;
  chainId: number;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  nonce: number;
}) => {
  const tokenAddress = getTokenAddressOnChain(token, chainId);

  const data = encodeFunctionData({
    abi: ERC20Abi,
    functionName: 'transfer',
    args: [to, amount],
  });

  const step: TransferStep = {
    tx: {
      to: tokenAddress,
      data,
      value: '0',
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      nonce,
      chainId,
      gas: 500_0000,
    },
    transferDetails: {
      to: to,
      amount: amount.toString(),
      amountFormatted: formatUnits(amount, token.decimals),
      amountUsd: '0',
      chainId,
    },
    serializedTx: '0x',
  };

  return step;
};

const buildETHTransferExecutionStep = ({
  amount,
  to,
  maxFeePerGas,
  maxPriorityFeePerGas,
  nonce,
  chainId,
}: {
  amount: bigint;
  to: Hex;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  chainId: number;
  nonce: number;
}) => {
  const step: TransferStep = {
    transferDetails: {
      to: to,
      amount: amount.toString(),
      amountFormatted: formatUnits(amount, 18),
      amountUsd: '0',
      chainId,
    },
    tx: {
      to: to,
      data: '0x',
      value: amount.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      nonce,
      chainId,
      gas: 500_0000,
    },
    serializedTx: '0x',
  };

  return step;
};

// Build the transaction data to sign
const buildMultiChainSend = async ({
  amount,
  token,
  sender,
  to,
  destinationChainId,
}: BuildMultiChainSendRequestBody) => {
  const balances = await Promise.all(
    token.addresses.map(async ({ chainId, address }) => {
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

  const bridgeSteps = await chooseBridgeInputs({
    sender,
    token,
    tokenBalance: balances,
    amount: BigInt(amount),
    destinationChainId,
  });

  const tokenPrice = await getTokenPrice({
    tokenAddress: token.addresses[0].address,
    chainId: token.addresses[0].chainId,
  });

  // Build the transfer step

  const gasInfos = await getGasInfo({
    chainIds: [destinationChainId],
  });

  const gasInfo = gasInfos.find(
    gasInfo => gasInfo.chainId === destinationChainId
  );

  if (!gasInfo) {
    throw new Error(`No gas info found for chainId ${destinationChainId}`);
  }

  const maxFeePerGas = gasInfo.baseFeePerGas + gasInfo.maxPriorityFeePerGas;
  const maxPriorityFeePerGas = gasInfo.maxPriorityFeePerGas;

  const nonce = await getNonce({
    chainId: destinationChainId,
    address: sender,
  });

  const transferStep: TransferStep =
    token.addresses[0].address === zeroAddress
      ? buildETHTransferExecutionStep({
          amount: BigInt(amount),
          to,
          maxFeePerGas,
          maxPriorityFeePerGas,
          nonce,
          chainId: destinationChainId,
        })
      : buildERC20TransferExecutionStep({
          token,
          amount: BigInt(amount),
          to,
          chainId: destinationChainId,
          maxFeePerGas,
          maxPriorityFeePerGas,
          nonce,
        });

  const totalInputAmount = bridgeSteps.reduce(
    (acc, step) => acc + BigInt(step.bridgeDetails.amountIn),
    0n
  );

  const inputAmountFormatted = formatAmount(
    totalInputAmount.toString(),
    token.decimals
  );

  const outputAmountFormatted = formatAmount(
    BigInt(amount).toString(),
    token.decimals
  );

  const tokenPriceUsd = tokenPrice.prices.find(p => p.currency === 'usd');

  if (!tokenPriceUsd) {
    throw new Error(`Token price not found for ${token.symbol}`);
  }

  const inputAmountUsd = new BigNumber(inputAmountFormatted).multipliedBy(
    new BigNumber(tokenPriceUsd.value)
  );
  const outputAmountUsd = new BigNumber(outputAmountFormatted).multipliedBy(
    new BigNumber(tokenPriceUsd.value)
  );

  const bridgeFee = totalInputAmount - BigInt(amount);
  const bridgeFeeFormatted = formatUnits(bridgeFee, token.decimals);
  const bridgeFeeUsd = new BigNumber(bridgeFeeFormatted).multipliedBy(
    new BigNumber(tokenPriceUsd.value)
  );

  const response: BuildMultiChainSendReturnType = {
    inputAmount: totalInputAmount.toString(),
    inputAmountFormatted,
    inputAmountUsd: inputAmountUsd.toString(),
    outputAmount: amount,
    outputAmountFormatted,
    outputAmountUsd: outputAmountUsd.toString(),
    bridgeFee: bridgeFee.toString(),
    bridgeFeeFormatted,
    bridgeFeeUsd: bridgeFeeUsd.toString(),
    bridgeSteps,
    transferStep,
  };

  return response;
};

export default buildMultiChainSend;
