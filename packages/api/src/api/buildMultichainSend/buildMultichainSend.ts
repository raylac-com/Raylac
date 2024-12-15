import {
  getPublicClient,
  getWalletClient,
  BuildMultiChainSendRequestBody,
  ERC20Abi,
  ExecutionStep,
  getERC20TokenBalance,
  getGasInfo,
  supportedChains,
  Token,
  BuildMultiChainSendReturnType,
} from '@raylac/shared';
import { getETHBalance } from '../getTokenBalances/getTokenBalances';
import { encodeFunctionData, formatUnits, Hex, zeroAddress } from 'viem';
import {
  convertViemChainToRelayChain,
  getClient,
} from '@reservoir0x/relay-sdk';
import { createClient, MAINNET_RELAY_API } from '@reservoir0x/relay-sdk';
import { getTokenAddressOnChain } from '../../utils';
import getTokenPrice from '../getTokenPrice/getTokenPrice';
import BigNumber from 'bignumber.js';

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

export const chooseBridgeInputs = ({
  tokenBalance,
  amount,
  destinationChainId,
}: {
  tokenBalance: {
    balance: bigint;
    chainId: number;
  }[];
  amount: bigint;
  destinationChainId: number;
}) => {
  const balanceOnDestinationChain =
    tokenBalance.find(b => b.chainId === destinationChainId)?.balance || 0n;

  if (balanceOnDestinationChain >= amount) {
    // We don't need to bridge anything
    return [];
  }

  const bridgeInputs: {
    chainId: number;
    amount: bigint;
  }[] = [];

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

    if (remainingAmount < chainBalance.balance) {
      bridgeInputs.push({
        chainId: chainBalance.chainId,
        amount: remainingAmount,
      });

      remainingAmount = 0n;
      break;
    } else {
      bridgeInputs.push({
        chainId: chainBalance.chainId,
        amount: chainBalance.balance,
      });

      remainingAmount = remainingAmount - chainBalance.balance;
    }
  }

  if (remainingAmount > 0n) {
    throw new Error(
      `Not enough balance, required ${amount}, remaining ${remainingAmount}`
    );
  }

  return bridgeInputs;
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

  const step: ExecutionStep = {
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
  const step: ExecutionStep = {
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

  const bridgeInputs = chooseBridgeInputs({
    tokenBalance: balances,
    amount: BigInt(amount),
    destinationChainId,
  });

  const relayClient = await getClient();

  let inputAmountPlusFee = BigInt(amount);

  const tokenPrice = await getTokenPrice({
    tokenAddress: token.addresses[0].address,
    chainId: token.addresses[0].chainId,
  });

  // Build the bridge steps
  const bridgeSteps = await Promise.all(
    bridgeInputs.map(async bridgeInput => {
      const walletClient = await getWalletClient({
        chainId: bridgeInput.chainId,
      });

      const fromTokenAddress = getTokenAddressOnChain(
        token,
        bridgeInput.chainId
      );
      const toTokenAddress = getTokenAddressOnChain(token, destinationChainId);

      const bridgeQuote = await relayClient.actions.getQuote({
        recipient: sender,
        chainId: bridgeInput.chainId,
        toChainId: destinationChainId,
        currency: fromTokenAddress,
        toCurrency: toTokenAddress,
        amount: bridgeInput.amount.toString(),
        // @ts-expect-error
        wallet: walletClient,
        tradeType: 'EXACT_OUTPUT',
      });

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
        chainId: bridgeInput.chainId,
        address: sender,
      });

      const relayerFee = bridgeQuote.fees?.relayer;

      if (!relayerFee) {
        throw new Error('relayerFee is undefined');
      }

      if (!relayerFee.amount) {
        throw new Error('relayerFee.amount is undefined');
      }

      inputAmountPlusFee += BigInt(relayerFee.amount);

      const bridgeStep: ExecutionStep = {
        relayerFee: {
          currency: {
            chainId: relayerFee?.currency?.chainId,
            address: relayerFee?.currency?.address as Hex,
            symbol: relayerFee?.currency?.symbol,
            name: relayerFee?.currency?.name,
            decimals: relayerFee?.currency?.decimals,
          },
          amount: relayerFee?.amount,
          amountFormatted: relayerFee?.amountFormatted,
          amountUsd: relayerFee?.amountUsd,
        },
        tx: {
          to: bridgeStepItem.data.to,
          data: bridgeStepItem.data.data,
          value: bridgeStepItem.data.value,
          maxFeePerGas: bridgeStepItem.data.maxFeePerGas,
          maxPriorityFeePerGas: bridgeStepItem.data.maxPriorityFeePerGas,
          nonce,
          chainId: bridgeInput.chainId,
          gas: 500_0000,
        },
        serializedTx: '0x',
      };

      return bridgeStep;
    })
  );

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

  const transferStep: ExecutionStep =
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

  const inputAmountFormatted = formatUnits(inputAmountPlusFee, token.decimals);
  const outputAmountFormatted = formatUnits(BigInt(amount), token.decimals);

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

  const bridgeFee = inputAmountPlusFee - BigInt(amount);
  const bridgeFeeFormatted = formatUnits(bridgeFee, token.decimals);
  const bridgeFeeUsd = new BigNumber(bridgeFeeFormatted).multipliedBy(
    new BigNumber(tokenPriceUsd.value)
  );

  const response: BuildMultiChainSendReturnType = {
    inputAmount: inputAmountPlusFee.toString(),
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
