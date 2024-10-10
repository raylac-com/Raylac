import 'dotenv/config';
import { beforeAll, describe, expect, it } from 'vitest';
import { getAuthedClient } from '../lib/rpc';
import { signInAsTestUser } from '../lib/auth';
import { Hex } from 'viem';
import { getAddressBalance } from '../lib/utils';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { getChainsForMode } from '@raylac/shared';

const IS_DEV_MODE = false;

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

  expect(actualBalance).toBe(balance);
};

describe('getAddressBalancesPerChain', () => {
  let token;

  beforeAll(async () => {
    const { token: _token } = await signInAsTestUser();

    token = _token;
  });

  it('should return the correct balances of the address for each chain', async () => {
    const authedClient = getAuthedClient(token);
    const stealthAccounts = await authedClient.getStealthAccounts.query();
    const balances = await authedClient.getAddressBalancesPerChain.query();

    // Iterate over all stealth accounts
    const promises = stealthAccounts.map(stealthAccount => {
      return Promise.all(
        // Iterate over all supported tokens
        supportedTokens.map(async token => {
          return Promise.all(
            // Iterate over all supported chains
            getChainsForMode(IS_DEV_MODE).map(async chain => {
              const tokenBalance =
                balances.find(
                  balance =>
                    balance.address === stealthAccount.address &&
                    balance.tokenId === token.tokenId &&
                    balance.chainId === chain.id
                )?.balance || '0';

              await checkBalance({
                tokenId: token.tokenId,
                address: stealthAccount.address as Hex,
                balance: BigInt(tokenBalance),
                chainId: chain.id,
              });
            })
          );
        })
      );
    });

    await Promise.all(promises);
  });
});
