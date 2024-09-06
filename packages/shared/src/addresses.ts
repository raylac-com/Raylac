import { anvil, base, baseSepolia } from 'viem/chains';
import { getChain } from './ethRpc';
import { Hex } from 'viem';

export const ERC5564_ANNOUNCER_ADDRESS =
  '0x55649E01B5Df198D18D95b5cc5051630cfD45564';

const chain = getChain();
// Only support Base Sepolia or Base mainnet for now
if (
  chain.id !== baseSepolia.id &&
  chain.id !== base.id &&
  chain.id !== anvil.id
) {
  throw new Error('Unsupported chain');
}

export const USDC_CONTRACT_ADDRESS =
  chain.id === baseSepolia.id || chain.id === anvil.id
    ? ('0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Hex)
    : ('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Hex);
