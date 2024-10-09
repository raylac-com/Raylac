import { createTestClient, http } from 'viem';
import { anvil } from 'viem/chains';

export const testClient = createTestClient({
  chain: anvil,
  mode: 'anvil',
  transport: http(),
});
