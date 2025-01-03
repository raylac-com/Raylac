import {
  BuildSendRequestBody,
  ERC20Abi,
  BuildSendReturnType,
  Token,
  getGasInfo,
  formatBalance,
  ETH,
} from '@raylac/shared';
import { getTokenAddressOnChain } from '../../utils';
import { getNonce } from '../../lib/utils';
import { encodeFunctionData, Hex } from 'viem';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';

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
}): BuildSendReturnType['tx'] => {
  const tokenAddress = getTokenAddressOnChain(token, chainId);

  const data = encodeFunctionData({
    abi: ERC20Abi,
    functionName: 'transfer',
    args: [to, amount],
  });

  return {
    to: tokenAddress,
    data,
    value: '0',
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    nonce,
    chainId,
    gas: 500_000,
  };
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
}): BuildSendReturnType['tx'] => {
  return {
    to: to,
    data: '0x',
    value: amount.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    nonce,
    chainId,
    gas: 500_000,
  };
};

const buildSend = async (
  requestBody: BuildSendRequestBody
): Promise<BuildSendReturnType> => {
  const gasInfo = await getGasInfo({ chainIds: [requestBody.chainId] });

  const baseFeePerGas = gasInfo[0].baseFeePerGas;
  const maxPriorityFeePerGas = gasInfo[0].maxPriorityFeePerGas;
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
      ? buildETHTransferExecutionStep({
          amount: BigInt(requestBody.amount),
          to: requestBody.toAddress,
          maxFeePerGas: BigInt(maxFeePerGas),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
          chainId: requestBody.chainId,
          nonce,
        })
      : buildERC20TransferExecutionStep({
          token: requestBody.token,
          amount: BigInt(requestBody.amount),
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

  const gasFeeFormatted = formatBalance({
    balance: gasFee,
    token: ETH,
    tokenPriceUsd: ethPriceUsd,
  });

  const formattedAmount = formatBalance({
    balance: BigInt(requestBody.amount),
    token: requestBody.token,
    tokenPriceUsd: tokenPriceUsd,
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
