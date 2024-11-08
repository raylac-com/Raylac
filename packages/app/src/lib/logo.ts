import baseLogo from '../../assets/chains/8453.png';
import arbitrumLogo from '../../assets/chains/42161.png';

export const getChainLogo = (chainId: number) => {
  switch (chainId) {
    case 8453:
      return baseLogo;
    case 42161:
      return arbitrumLogo;
    default:
      throw new Error(`No logo for chainId: ${chainId}`);
  }
};
