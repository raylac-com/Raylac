import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { getAuthedClient } from '../lib/rpc';
import { Hex } from 'viem';
import { getAddressBalance } from '../lib/utils';
import { supportedChains, supportedTokens, getChainName } from '@raylac/shared';

/**
 * Check if the given balance of the address
 * matches the actual balance
 */
const checkBalance = async ({
  tokenId,
  address,
  balance,
  chainId,
}: {
  tokenId: string;
  address: Hex;
  balance: bigint;
  chainId: number;
}) => {
  const actualBalance = await getAddressBalance({
    tokenId,
    address,
    chainId,
  });

  expect(
    actualBalance,
    `Token ${tokenId} balance mismatch for address ${address} on ${getChainName(chainId)}`
  ).toBe(balance);
};

describe('getAddressBalancesPerChain', () => {
  it('should return the correct balances of the address for each chain', async () => {
    const authedClient = await getAuthedClient();
    const stealthAccounts = await authedClient.getStealthAccounts.query();
    const balances = await authedClient.getAddressBalancesPerChain.query();

    for (const token of supportedTokens) {
      for (const chain of supportedChains) {
        const promises: Promise<void>[] = [];

        // We run `checkBalance` for each account concurrently to make test run faster.
        // But we only do concurrent executions among stealth accounts (and not all the token - chain - account combinations)
        // to avoid hitting the RPC rate limit.
        for (const stealthAccount of stealthAccounts) {
          const tokenBalance =
            balances.find(
              balance =>
                balance.address === stealthAccount.address &&
                balance.tokenId === token.tokenId &&
                balance.chainId === chain.id
            )?.balance || '0';

          promises.push(
            checkBalance({
              tokenId: token.tokenId,
              address: stealthAccount.address as Hex,
              balance: BigInt(tokenBalance),
              chainId: chain.id,
            })
          );
        }

        await Promise.all(promises);
      }
    }
  });
});
