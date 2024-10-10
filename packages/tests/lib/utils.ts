import {
  ERC20Abi,
  getPublicClient,
  getTokenAddressOnChain,
} from '@raylac/shared';
import { Hex } from 'viem';

const getNativeBalance = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });
  return await client.getBalance({ address });
};

const getERC20Balance = async ({
  address,
  tokenAddress,
  chainId,
}: {
  address: Hex;
  tokenAddress: Hex;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });

  const balance = await client.readContract({
    address: tokenAddress,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return balance;
};

export const getAddressBalance = async ({
  tokenId,
  address,
  chainId,
}: {
  tokenId: string;
  address: Hex;
  chainId: number;
}) => {
  if (tokenId === 'eth') {
    return getNativeBalance({ address, chainId });
  } else {
    const tokenAddress = getTokenAddressOnChain({ chainId, tokenId });
    return await getERC20Balance({ address, tokenAddress, chainId });
  }
};
