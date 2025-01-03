import { encodeFunctionData, Hex } from 'viem';
import { ERC20Abi } from '@raylac/shared';
import { getPublicClient } from '../utils';

export const getERC20TokenBalance = async ({
  contractAddress,
  chainId,
  address,
}: {
  contractAddress: Hex;
  chainId: number;
  address: Hex;
}) => {
  const publicClient = getPublicClient({
    chainId,
  });

  const balance = await publicClient.readContract({
    address: contractAddress,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [address],
    blockTag: 'latest',
  });

  return balance;
};

export const encodeApproveCall = ({
  spender,
  amount,
}: {
  spender: Hex;
  amount: bigint;
}) => {
  return encodeFunctionData({
    abi: ERC20Abi,
    functionName: 'approve',
    args: [spender, amount],
  });
};
