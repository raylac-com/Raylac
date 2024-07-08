import { Hex } from 'viem';
import { ERC20Abi, USDC_CONTRACT_ADDRESS } from '@sutori/shared';
import { publicClient } from './viem';

export const getUSDCBalance = async ({ address }: { address: Hex }) => {
  console.log('Getting USDC balance for', USDC_CONTRACT_ADDRESS);
  console.log(publicClient.chain.name);
  const balance = await publicClient.readContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return balance;
};
