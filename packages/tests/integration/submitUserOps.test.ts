import 'dotenv/config';
import { beforeAll, expect, it } from 'vitest';
import {
  getGasInfo,
  StealthAddressWithEphemeral,
  supportedTokens,
  toCoingeckoTokenId,
  devChains,
  buildUserOp,
  UserActionType,
  encodeUserActionTag,
  generateRandomMultiChainTag,
} from '@raylac/shared';
import { parseUnits, parseEther, zeroAddress, Hex } from 'viem';
import { client, getAuthedClient } from '../lib/rpc';
import { describe } from 'node:test';
import {
  createStealthAccountForTestUser,
  getTestClient,
  signUserOpWithTestUserAccount,
  signUserOpWithPaymasterAccount,
} from '../lib/utils';
import prisma from '../lib/prisma';
import { Prisma } from '@raylac/db';
import { anvil } from 'viem/chains';

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

const selectUserAction = {
  id: true,
  groupTag: true,
  groupSize: true,
  transactions: {
    select: {
      hash: true,
      chainId: true,
      block: {
        select: {
          number: true,
          chainId: true,
        },
      },
      traces: {
        select: {
          from: true,
          to: true,
          tokenId: true,
          tokenPriceAtTrace: true,
          amount: true,
          UserStealthAddressFrom: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserActionSelect;

type QueryUserActionResult = Prisma.UserActionGetPayload<{
  select: typeof selectUserAction;
}>;

const USD_AMOUNT = 33;

/**
 * Test that the `submitUserOps` endpoint works correctly

* Steps:
 * 1. Create a stealth account
 * 2. Fund the stealth account on all dev chains
 * 3. Send ETH to a recipient from the stealth account on a single chain
 * 4. Check that the user action is correctly indexed
 */
describe('submitUserOps', () => {
  // The stealth account used as the sender in this test
  let stealthAccount: StealthAddressWithEphemeral;

  beforeAll(async () => {
    stealthAccount = await createStealthAccountForTestUser({
      syncOnChainIds: devChains.map(c => c.id),
      announcementChainId: anvil.id,
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

  describe(`send ETH on a single chain`, () => {
    const groupTag = generateRandomMultiChainTag();

    // The group size is hardcoded for this test
    const groupSize = 1;

    // The tx hashes of the transactions submitted to the RPC endpoint
    let txHash: Hex;

    // The token price used in this test
    let tokenPrice: { usd: number };

    // The `UserAction` saved in the db as a result of calling `submitUserOps`
    let savedUserAction: QueryUserActionResult | null;

    beforeAll(async () => {
      const authedClient = await getAuthedClient();
      const to = zeroAddress;

      tokenPrice = await getTokenPrice('eth');

      const amount = await fromUsdAmount({
        tokenId: 'eth',
        tokenPriceUsd: USD_AMOUNT,
      });

      const gasInfo = await getGasInfo({
        chainIds: devChains.map(c => c.id),
      });

      const tag = encodeUserActionTag({
        groupTag,
        groupSize,
        userActionType: UserActionType.Transfer,
      });

      const chain = devChains[0];

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

      // Submit the user operations to the RPC endpoint
      const result = await authedClient.submitUserOps.mutate({
        userOps: [signedUserOp],
        tokenPrice: tokenPrice.usd,
      });

      const testClient = getTestClient({ chainId: anvil.id });
      await testClient.mine({ blocks: 1 });

      txHash = result.txHashes[0];

      // Get the `UserAction` from the db
      savedUserAction = await prisma.userAction.findUnique({
        select: selectUserAction,
        where: { txHashes: [txHash] },
      });
    });

    it(`should save the user action`, () => {
      expect(savedUserAction).not.toBeNull();
    });

    it(`should save the transaction`, () => {
      expect(savedUserAction!.transactions[0].hash).toBe(txHash);
    });

    it(`should save the token price`, () => {
      // Get the token prices from the traces
      const tokenPriceInTrace =
        savedUserAction!.transactions[0].traces[0].tokenPriceAtTrace;

      expect(tokenPriceInTrace).toBe(tokenPrice.usd);
    });

    it(`should save the correct amount`, () => {
      const amount = savedUserAction!.transactions[0].traces[0].amount;

      expect(amount).toBe(amount);
    });

    it(`should save the native transfer traces with the test user's stealth address`, () => {
      const trace = savedUserAction!.transactions[0].traces[0];

      expect(trace.UserStealthAddressFrom).not.toBeNull();
    });

    it(`should save the correct group tag`, () => {
      expect(savedUserAction!.groupTag).toBe(groupTag);
    });

    it(`should save the correct group size`, () => {
      expect(savedUserAction!.groupSize).toBe(groupSize);
    });
  });
});
