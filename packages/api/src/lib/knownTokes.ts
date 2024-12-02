import { Token } from '@raylac/shared';
import { getAddress } from 'viem';
import { base, optimism } from 'viem/chains';

export const KNOWN_TOKENS = {
  [Token.USDC]: {
    decimals: 6,
    addresses: [
      {
        chainId: base.id,
        address: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
      },
      {
        chainId: optimism.id,
        address: getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
      },
    ],
  },
};
