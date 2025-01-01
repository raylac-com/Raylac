import {
  BuildAggregateSendRequestBody,
  ERC20Abi,
  TransferStep,
  BuildAggregateSendReturnType,
  Token,
  getGasInfo,
} from '@raylac/shared';
import { getTokenAddressOnChain } from '../../utils';
import { getNonce } from '../../lib/utils';
import { encodeFunctionData, formatUnits, Hex } from 'viem';
import BigNumber from 'bignumber.js';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';

const buildERC20TransferExecutionStep = ({
  token,
  amount,
  to,
  chainId,
  maxFeePerGas,
  maxPriorityFeePerGas,
  nonce,
  tokenPriceUsd,
}: {
  token: Token;
  amount: bigint;
  to: Hex;
  chainId: number;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  nonce: number;
  tokenPriceUsd: string;
}) => {
  const tokenAddress = getTokenAddressOnChain(token, chainId);

  const data = encodeFunctionData({
    abi: ERC20Abi,
    functionName: 'transfer',
    args: [to, amount],
  });

  const amountUsd = new BigNumber(
    formatUnits(amount, token.decimals)
  ).multipliedBy(new BigNumber(tokenPriceUsd));

  const step: TransferStep = {
    tx: {
      to: tokenAddress,
      data,
      value: '0',
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      nonce,
      chainId,
      gas: 500_000,
    },
    transferDetails: {
      to: to,
      amount: amount.toString(),
      amountFormatted: formatUnits(amount, token.decimals),
      amountUsd: amountUsd.toString(),
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
  tokenPriceUsd,
}: {
  amount: bigint;
  to: Hex;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  chainId: number;
  nonce: number;
  tokenPriceUsd: string;
}) => {
  const amountUsd = new BigNumber(formatUnits(amount, 18)).multipliedBy(
    new BigNumber(tokenPriceUsd)
  );

  const step: TransferStep = {
    transferDetails: {
      to: to,
      amount: amount.toString(),
      amountFormatted: formatUnits(amount, 18),
      amountUsd: amountUsd.toString(),
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
      gas: 500_000,
    },
    serializedTx: '0x',
  };

  return step;
};

const buildAggregateSend = async (
  requestBody: BuildAggregateSendRequestBody
): Promise<BuildAggregateSendReturnType> => {
  const gasInfo = await getGasInfo({ chainIds: [requestBody.chainId] });

  const baseFeePerGas = gasInfo[0].baseFeePerGas;
  const maxPriorityFeePerGas = gasInfo[0].maxPriorityFeePerGas;
  const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas;

  if (requestBody.fromAddresses.length > 1) {
    throw new Error('Multiple from addresses not supported');
  }

  const fromAddress = requestBody.fromAddresses[0];
  const nonce = await getNonce({
    chainId: requestBody.chainId,
    address: fromAddress,
  });

  const tokenPriceUsd = await getTokenUsdPrice({
    token: requestBody.token,
  });

  if (tokenPriceUsd === 'notfound') {
    throw new Error('Token price not found');
  }

  const tx =
    requestBody.token.symbol === 'ETH'
      ? buildETHTransferExecutionStep({
          amount: BigInt(requestBody.amount),
          to: requestBody.toAddress,
          maxFeePerGas: BigInt(maxFeePerGas),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
          chainId: requestBody.chainId,
          nonce,
          tokenPriceUsd: tokenPriceUsd.toString(),
        })
      : buildERC20TransferExecutionStep({
          token: requestBody.token,
          amount: BigInt(requestBody.amount),
          to: requestBody.toAddress,
          chainId: requestBody.chainId,
          maxFeePerGas: BigInt(maxFeePerGas),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
          nonce,
          tokenPriceUsd: tokenPriceUsd.toString(),
        });

  return {
    inputs: [tx],
  };
};

export default buildAggregateSend;
