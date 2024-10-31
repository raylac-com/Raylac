import { Chain } from 'viem';
import * as chains from 'viem/chains';

const supportedChains: Chain[] = [
  // chains.mainnet,
  //  chains.optimism,
  //  chains.optimismSepolia,
  chains.base,
  chains.arbitrum,
  chains.scroll,
  chains.optimism,
  chains.polygon,
  // chains.baseSepolia,
];

export default supportedChains;
