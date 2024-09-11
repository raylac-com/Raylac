import { Chain, Hex } from 'viem';
import { ERC20Abi, getAlchemyRpcUrl, getPublicClient } from '@raylac/shared';

export const getTokenBalance = async ({
  contractAddress,
  chain,
  address,
}: {
  contractAddress: Hex;
  chain: Chain;
  address: Hex;
}) => {
  const publicClient = getPublicClient({
    chain,
    rpcUrl: getAlchemyRpcUrl({
      chain,
    }),
  });

  console.log('Getting balance for', address, 'on chain', chain.name, chain.id);
  const balance = await publicClient.readContract({
    address: contractAddress,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [address],
    blockTag: 'latest',
  });

  return balance;
};
