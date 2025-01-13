import {
  ERC20Abi,
  ETH,
  formatTokenAmount,
  GetEstimatedTransferGasRequestBody,
  getPublicClient,
  getTokenAddressOnChain,
  GetEstimatedTransferGasReturnType,
} from '@raylac/shared';
import { encodeFunctionData, zeroAddress } from 'viem';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';

const getEstimatedTransferGas = async ({
  chainId,
  token,
  amount,
  to,
  from,
  maxFeePerGas,
}: GetEstimatedTransferGasRequestBody): Promise<GetEstimatedTransferGasReturnType> => {
  const publicClient = getPublicClient({ chainId });

  let estimatedGasWei;

  if (token.addresses[0].address === zeroAddress) {
    const estimatedGas = await publicClient.estimateGas({
      account: from,
      to: to,
      value: BigInt(amount),
      data: '0x',
    });

    estimatedGasWei = estimatedGas * BigInt(maxFeePerGas);
  } else {
    const tokenAddressOnChain = getTokenAddressOnChain(token, chainId);

    const data = encodeFunctionData({
      abi: ERC20Abi,
      functionName: 'transfer',
      args: [to, BigInt(amount)],
    });

    const estimatedGas = await publicClient.estimateGas({
      account: from,
      to: tokenAddressOnChain,
      value: BigInt(0),
      data,
    });

    estimatedGasWei = estimatedGas * BigInt(maxFeePerGas);
  }

  const ethPriceUsd = await getTokenUsdPrice({
    token: ETH,
  });

  if (ethPriceUsd === null) {
    throw new Error('ETH price not found');
  }

  const estimatedGasUsd = formatTokenAmount({
    amount: estimatedGasWei,
    token: ETH,
    tokenPrice: {
      usd: ethPriceUsd.toString(),
      jpy: (ethPriceUsd * 140).toString(),
    },
  });

  return estimatedGasUsd;
};

export default getEstimatedTransferGas;
