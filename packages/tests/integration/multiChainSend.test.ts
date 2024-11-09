import 'dotenv/config';
import { beforeAll, expect, test } from 'vitest';
import {
  getGasInfo,
  StealthAddressWithEphemeral,
  supportedTokens,
  toCoingeckoTokenId,
  devChains,
  buildUserOp,
  UserOperation,
  UserActionType,
} from '@raylac/shared';
import { parseUnits, parseEther, zeroAddress, pad } from 'viem';
import { client, getAuthedClient } from '../lib/rpc';
import { describe } from 'node:test';
import {
  createStealthAccountForTestUser,
  getTestClient,
  signUserOpWithTestUserAccount,
  signUserOpWithPaymasterAccount,
  getUserActionTag,
} from '../lib/utils';
import prisma from '../lib/prisma';

/**
 * Get the current USD price of a token
 */
const getTokenPrice = async (tokenId: string) => {
  if (tokenId === 'usdc') {
    return { usd: 1 };
  }

  const tokenPrices = await client.getTokenPrices.query();

  const price = tokenPrices[toCoingeckoTokenId(tokenId)];

  if (price === undefined) {
    throw new Error(`Token price not found for ${tokenId}`);
  }

  return price;
};

/**
 * Get the amount of tokens from the USD amount
 */
const fromUsdAmount = async ({
  tokenId,
  tokenPriceUsd,
}: {
  tokenId: string;
  tokenPriceUsd: number;
}) => {
  const tokenMeta = supportedTokens.find(token => token.tokenId === tokenId);

  if (!tokenMeta) {
    throw new Error(`Token metadata not found for ${tokenId}`);
  }

  const tokenPrice = await getTokenPrice(tokenId);

  const amountFormatted = (tokenPriceUsd / tokenPrice.usd).toString();

  const amount = parseUnits(amountFormatted, tokenMeta.decimals);

  return amount;
};

const USD_AMOUNT = 0.01;
describe('multiChainSend', () => {
  let stealthAccount: StealthAddressWithEphemeral;
  beforeAll(async () => {
    stealthAccount = await createStealthAccountForTestUser({
      useAnvil: true,
    });

    // Fund the stealth account on all dev chains
    for (const chain of devChains) {
      const testClient = getTestClient({ chainId: chain.id });
      await testClient.setBalance({
        address: stealthAccount.address,
        value: parseEther('1000'),
      });
    }
  });

  test(`should be able to send eth on multiple chains at once`, async () => {
    const authedClient = await getAuthedClient();
    const to = zeroAddress;

    const tokenPrice = await getTokenPrice('eth');

    const amount = await fromUsdAmount({
      tokenId: 'eth',
      tokenPriceUsd: USD_AMOUNT,
    });

    const gasInfo = await getGasInfo({
      chainIds: devChains.map(c => c.id),
    });

    const signedUserOps: UserOperation[] = [];

    const groupTag = pad('0x3333', { size: 32 });
    const groupSize = 2;

    const tag = getUserActionTag({
      groupTag,
      groupSize,
      userActionType: UserActionType.Transfer,
    });

    for (const chain of devChains) {
      const chainGasInfo = gasInfo.find(g => g.chainId === chain.id);

      if (!chainGasInfo) {
        throw new Error(`Gas info not found for chain ${chain.id}`);
      }

      const userOp = buildUserOp({
        stealthSigner: stealthAccount.signerAddress,
        to,
        value: amount,
        data: '0x',
        tag,
        chainId: chain.id,
        gasInfo: chainGasInfo,
        nonce: null,
      });

      // Get the paymaster signature
      const paymasterSignedUserOp = await signUserOpWithPaymasterAccount({
        userOp,
      });

      // Sign the user operation with the test user's stealth account
      const signedUserOp = await signUserOpWithTestUserAccount({
        userOp: paymasterSignedUserOp,
        stealthAccount,
      });

      signedUserOps.push(signedUserOp);
    }

    // Submit the user operations to the RPC endpoint
    const txHashes = await authedClient.submitUserOps.mutate({
      userOps: signedUserOps,
      tokenPrice: tokenPrice.usd,
    });

    const sortedTxHashes = txHashes.sort();

    // Check that the user action is correctly indexed
    const userAction = await prisma.userAction.findUnique({
      where: { txHashes: sortedTxHashes },
    });

    expect(userAction).not.toBeNull();
    expect(userAction?.groupSize).toBe(groupSize);
    expect(userAction?.groupTag).toBe(groupTag);
  });
});
