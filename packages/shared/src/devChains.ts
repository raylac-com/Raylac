import { defineChain } from 'viem';
import { anvil } from 'viem/chains';

export const anvil1 = defineChain({
  ...anvil,
  name: 'Anvil 1',
  port: 8545,
});

export const anvil2 = defineChain({
  ...anvil,
  id: 31_338 as number,
  name: 'Anvil 2',
  port: 8546,
});

export const devChains = [anvil1, anvil2];
