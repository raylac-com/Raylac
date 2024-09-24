import { Chain } from 'viem';
import * as chains from 'viem/chains';

const supportedChains: Chain[] = [
  // chains.mainnet,
//  chains.optimism,
//  chains.optimismSepolia,
  chains.base,
  chains.baseSepolia,
];

export default supportedChains;
