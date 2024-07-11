import { anvil, base, baseSepolia } from 'viem/chains';
import { getChain } from './ethRpc';
import { Hex } from 'viem';

export const ACCOUNT_IMPL_ADDRESS =
  '0x9371d70Fe251B8Bb952bFC0cD682d0923A69999c';

export const ACCOUNT_FACTORY_ADDRESS =
  '0x477C019ecF78fdEEd8C0937841CCd6177a525d35';

export const SUTORI_PAYMASTER_ADDRESS =
  '0xC0Ac0d6C27cd5afECeC8cF3401f860552b4ab075';

export const ENTRY_POINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

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
