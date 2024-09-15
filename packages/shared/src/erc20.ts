import { encodeFunctionData, Hex } from 'viem';
import { ERC20Abi, getPublicClient } from './';

export const getTokenBalance = async ({
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

  console.log('Getting balance for', address, chainId);
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
