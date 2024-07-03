import { Hex } from 'viem';
import client from './viemClient';
import { ERC20Abi } from '@sutori/shared';

export const BASE_USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export const getUSDCBalance = async ({ address }: { address: Hex }) => {
  const balance = await client.readContract({
    address: BASE_USDC_CONTRACT,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return balance
};
