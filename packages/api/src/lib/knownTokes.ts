import { supportedChains, Token } from '@raylac/shared';
import { getAddress, Hex, zeroAddress } from 'viem';
import { base, optimism } from 'viem/chains';

export const KNOWN_TOKENS = {
  [Token.ETH]: {
    decimals: 18,
    addresses: supportedChains.map(chain => ({
      chainId: chain.id,
      address: zeroAddress,
    })),
  },
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
  [Token.RETH]: {
    decimals: 18,
    addresses: [
      {
        chainId: base.id,
        address: getAddress('0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c'),
      },
      {
        chainId: optimism.id,
        address: getAddress('0x9Bcef72be871e61ED4fBbc7630889beE758eb81D'),
      },
    ],
  },
};

export const isKnownToken = ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}) => {
  return Object.values(KNOWN_TOKENS).some(({ addresses }) =>
    addresses.some(
      knownToken =>
        knownToken.address === tokenAddress && knownToken.chainId === chainId
    )
  );
};
