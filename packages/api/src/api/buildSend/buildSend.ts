import {
  BuildSendRequestBody,
  ERC20Abi,
  BuildSendReturnType,
  Token,
  formatTokenAmount,
  ETH,
  getPublicClient,
} from '@raylac/shared';
import { getTokenAddressOnChain } from '../../utils';
import { getNonce, getGasInfo } from '../../utils';
import { encodeFunctionData, Hex } from 'viem';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';

const buildERC20TransferExecutionStep = async ({
  token,
  amount,
  from,
  to,
  chainId,
  maxFeePerGas,
  maxPriorityFeePerGas,
  nonce,
}: {
  token: Token;
  amount: bigint;
  from: Hex;
  to: Hex;
  chainId: number;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  nonce: number;
}): Promise<BuildSendReturnType['tx']> => {
  const tokenAddress = getTokenAddressOnChain(token, chainId);

  const data = encodeFunctionData({
    abi: ERC20Abi,
    functionName: 'transfer',
    args: [to, amount],
  });

  const publicClient = getPublicClient({
    chainId,
  });

  const gas = await publicClient.estimateGas({
    account: from,
    to: tokenAddress,
    data,
    value: BigInt(0),
  });

  return {
    to: tokenAddress,
    data,
    value: '0',
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    nonce,
    chainId,
    gas: Number(gas),
  };
};

const buildETHTransferExecutionStep = async ({
  amount,
  to,
  from,
  maxFeePerGas,
  maxPriorityFeePerGas,
  nonce,
  chainId,
}: {
  amount: bigint;
  to: Hex;
  from: Hex;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  chainId: number;
  nonce: number;
}): Promise<BuildSendReturnType['tx']> => {
  const publicClient = getPublicClient({
    chainId,
  });

  const gas = await publicClient.estimateGas({
    account: from,
    to: to,
    data: '0x',
    value: amount,
  });

  return {
    to: to,
    data: '0x',
    value: amount.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    nonce,
    chainId,
    gas: Number(gas),
  };
};

const buildSend = async (
  requestBody: BuildSendRequestBody
): Promise<BuildSendReturnType> => {
  const gasInfo = await getGasInfo({ chainId: requestBody.chainId });

  const baseFeePerGas = gasInfo.baseFeePerGas;
  const maxPriorityFeePerGas = gasInfo.maxPriorityFeePerGas;
  const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas;

  const fromAddress = requestBody.fromAddress;

  const nonce = await getNonce({
    chainId: requestBody.chainId,
    address: fromAddress,
  });

  const tokenPriceUsd = await getTokenUsdPrice({
    token: requestBody.token,
  });

  if (tokenPriceUsd === null) {
    throw new Error('Token price not found');
  }

  const tx =
    requestBody.token.symbol === 'ETH'
      ? await buildETHTransferExecutionStep({
          amount: BigInt(requestBody.amount),
          to: requestBody.toAddress,
          from: fromAddress,
          maxFeePerGas: BigInt(maxFeePerGas),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
          chainId: requestBody.chainId,
          nonce,
        })
      : await buildERC20TransferExecutionStep({
          token: requestBody.token,
          amount: BigInt(requestBody.amount),
          from: fromAddress,
          to: requestBody.toAddress,
          chainId: requestBody.chainId,
          maxFeePerGas: BigInt(maxFeePerGas),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
          nonce,
        });

  const gasFee = BigInt(tx.gas) * BigInt(maxFeePerGas);

  const ethPriceUsd = await getTokenUsdPrice({ token: ETH });

  if (ethPriceUsd === null) {
    throw new Error('ETH price not found');
  }

  const gasFeeFormatted = formatTokenAmount({
    amount: gasFee,
    token: ETH,
    tokenPrice: {
      usd: ethPriceUsd.toString(),
      jpy: (ethPriceUsd * 140).toString(),
    },
  });

  const formattedAmount = formatTokenAmount({
    amount: BigInt(requestBody.amount),
    token: requestBody.token,
    tokenPrice: {
      usd: tokenPriceUsd.toString(),
      jpy: (tokenPriceUsd * 140).toString(),
    },
  });

  return {
    tx,
    transfer: {
      from: fromAddress,
      to: requestBody.toAddress,
      amount: formattedAmount,
      token: requestBody.token,
      gasFee: gasFeeFormatted,
    },
  };
};

export default buildSend;
