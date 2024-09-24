import { Hex } from 'viem';
import { base, baseSepolia } from 'viem/chains';

export const ACROSS_SPOKE_POOL_ADDRESS: {
  [key: number]: Hex;
} = {
  [base.id]: '0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64',
  [baseSepolia.id]: '0x82B564983aE7274c86695917BBf8C99ECb6F0F8F',
};

export const ACCOUNT_IMPL_ADDRESS =
  '0x0C1dC4F8Def401c3DeE76Cdef590BB99F63b3015';

export const ACCOUNT_FACTORY_ADDRESS =
  '0x80eBd03E432B44a3DFE98c0A3bBD5b0c1F0269Cf';

export const RAYLAC_PAYMASTER_ADDRESS =
  '0xCa7bEdEcCd6FBD68d0043bb4c4B2405B4948BC8c';

export const ENTRY_POINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

export const ERC5564_ANNOUNCER_ADDRESS =
  '0x55649E01B5Df198D18D95b5cc5051630cfD45564';

export const ACCOUNT_IMPL_DEPLOYED_BLOCK: {
  [key: number]: bigint;
} = {
  [baseSepolia.id]: BigInt(15433556),
  [base.id]: BigInt(20053821)
};
