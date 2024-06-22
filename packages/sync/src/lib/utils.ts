import { base, baseSepolia } from 'viem/chains';

export const getChain = () => {
  const chain =
    process.env.NODE_ENV === 'development' || process.env.CHAIN === 'sepolia'
      ? baseSepolia
      : base;

  return chain;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
