import { base, baseSepolia } from 'viem/chains';

export const getChain = () => {
  const chain =
    process.env.NODE_ENV === 'development' || process.env.CHAIN === 'sepolia'
      ? baseSepolia
      : base;

  return chain;
};