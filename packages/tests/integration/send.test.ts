import 'dotenv/config';
import { expect, test } from 'vitest';
import {
  AddressTokenBalance,
  generateStealthAddressV2,
  getGasInfo,
  getSpendingPrivKey,
  getViewingPrivKey,
  getWalletClient,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  signUserOpWithStealthAccount,
  StealthAddressWithEphemeral,
  supportedTokens,
  toCoingeckoTokenId,
} from '@raylac/shared';
import { buildMultiChainSendRequestBody } from '@raylac/shared/src/multiChainSend';
import { parseUnits, Hex, zeroAddress } from 'viem';
import { anvil, base } from 'viem/chains';
import { encodePaymasterAndData } from '@raylac/shared/src/utils';
import { client, getAuthedClient, getTestUserId } from '../lib/rpc';
import { describe } from 'node:test';
import { getAddressBalance, testClient } from '../lib/utils';
import { TEST_ACCOUNT_MNEMONIC } from '../lib/auth';
import {
  manageReorgsForChain,
  waitForAnnouncementsBackfill,
} from '@raylac/sync';

const IS_DEV_MODE = false;

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

const send = async ({
  amount,
  tokenId,
  to,
  numInputs,
  chainId,
}: {
  amount: bigint;
  tokenId: string;
  to: Hex;
  numInputs: number;
  chainId: number;
}) => {
  const authedClient = await getAuthedClient();

  const spendingPrivKey = getSpendingPrivKey(TEST_ACCOUNT_MNEMONIC);
  const viewingPrivKey = getViewingPrivKey(TEST_ACCOUNT_MNEMONIC);

  let addressBalancePerChain =
    await authedClient.getAddressBalancesPerChain.query();

  // Modify `addressBalancePerChain` to test multiple input transfers

  addressBalancePerChain = addressBalancePerChain.map(addressBalance => {
    if (BigInt(addressBalance.balance) >= amount) {
      return {
        ...addressBalance,
        balance: ((amount + BigInt(1)) / BigInt(numInputs)).toString(),
      };
    }

    return addressBalance;
  });

  const gasInfo = await getGasInfo({
    isDevMode: IS_DEV_MODE,
  });

  const stealthAccounts = await authedClient.getStealthAccounts.query();
  const addressNonces = await authedClient.getAddressNonces.query();

  const userOps = buildMultiChainSendRequestBody({
    addressTokenBalances: addressBalancePerChain as AddressTokenBalance[],
    stealthAddresses: stealthAccounts as StealthAddressWithEphemeral[],
    addressNonces,
    gasInfo,
    amount,
    chainId,
    to,
    tokenId,
  });

  const signedUserOps = await Promise.all(
    userOps.map(async userOp => {
      // Get the paymaster signature
      const paymasterAndData = encodePaymasterAndData({
        paymaster: RAYLAC_PAYMASTER_V2_ADDRESS,
        data: await authedClient.paymasterSignUserOp.mutate({ userOp }),
      });
      userOp.paymasterAndData = paymasterAndData;

      const stealthAccount = stealthAccounts.find(
        stealthAccount => stealthAccount.address === userOp.sender
      );

      if (!stealthAccount) {
        throw new Error(
          `Stealth account not found for userOp.sender: ${userOp.sender}`
        );
      }

      // Sign the user operation with the stealth account
      const signedUserOp = await signUserOpWithStealthAccount({
        userOp,
        stealthAccount: stealthAccount as StealthAddressWithEphemeral,
        spendingPrivKey,
        viewingPrivKey,
      });

      return signedUserOp;
    })
  );

  const tokenPrice = await getTokenPrice(tokenId);

  await authedClient.submitUserOps.mutate({
    userOps: signedUserOps,
    tokenPrice: tokenPrice.usd,
  });
};

/**
 * Get the balance of the test user for a given token.
 * This functions sums up the balance of the test user for all chains.
 */
const getTestUserBalance = async ({ tokenId }: { tokenId: string }) => {
  const authedClient = await getAuthedClient();
  const senderTokenBalances = await authedClient.getTokenBalances.query();

  const senderBalance = senderTokenBalances.find(
    balance => balance.tokenId === tokenId
  )?.balance;

  if (!senderBalance) {
    throw new Error(`Sender does not have ${tokenId} balance`);
  }

  return BigInt(senderBalance);
};

const USD_AMOUNT = 0.01;
describe('send', () => {
  describe('send from various inputs', () => {
    const chainId = base.id;

    for (const tokenId of supportedTokens.map(token => token.tokenId)) {
      for (const numInputs of [1, 2]) {
        test(`should be able to send ${tokenId} with ${numInputs} inputs`, async () => {
          const to = '0x06D35f6B8Fb9Ad47A866052b6a6C3c2DcD1C36F1';

          const senderBalanceBefore = await getTestUserBalance({
            tokenId,
          });

          const recipientBalanceBefore = await getAddressBalance({
            tokenId,
            address: to,
            chainId: chainId,
          });

          const amount = await fromUsdAmount({
            tokenId,
            tokenPriceUsd: USD_AMOUNT,
          });

          await send({
            amount,
            tokenId,
            to,
            numInputs,
            chainId,
          });

          const senderBalanceAfter = await getTestUserBalance({
            tokenId,
          });

          expect(senderBalanceAfter).toEqual(senderBalanceBefore - amount);

          const recipientBalanceAfter = await getAddressBalance({
            tokenId,
            address: to,
            chainId: chainId,
          });

          expect(recipientBalanceAfter).toEqual(
            recipientBalanceBefore + amount
          );
        });
      }
    }
  });

  test.skip('should handle reorgs', async () => {
    const chainId = anvil.id;

    // Start the indexer for the chain
    const unwatch = await manageReorgsForChain(chainId);

    // 1. Send
    // 2. Revert the tx
    // 3. Check the balance and transfer history

    const snapshot = await testClient.snapshot();

    const amount = await fromUsdAmount({
      tokenId: 'usdc',
      tokenPriceUsd: USD_AMOUNT,
    });

    const testUserId = await getTestUserId();

    const testUser = await client.getUser.query({ userId: testUserId });

    if (!testUser) {
      throw new Error('Test user not found');
    }

    // Generate a new stealth address for the test user
    const newStealthAccount = generateStealthAddressV2({
      spendingPubKey: testUser.spendingPubKey as Hex,
      viewingPubKey: testUser.viewingPubKey as Hex,
    });

    // Submit the stealth address to the server
    await client.addStealthAccount.mutate({
      address: newStealthAccount.address,
      signerAddress: newStealthAccount.signerAddress,
      ephemeralPubKey: newStealthAccount.ephemeralPubKey,
      viewTag: newStealthAccount.viewTag,
      userId: testUser.id,
      label: '',
    });

    const funderAddress = zeroAddress;

    // Fund the new account
    await testClient.setBalance({
      address: funderAddress,
      value: parseUnits('1', 18),
    });

    const walletClient = await getWalletClient({
      chainId,
    });

    await testClient.impersonateAccount({
      address: funderAddress,
    });
    // Send the funds to the stealth account
    await walletClient.sendTransaction({
      to: newStealthAccount.address,
      value: parseUnits('0.1', 18),
      account: funderAddress,
    });

    await testClient.stopImpersonatingAccount({
      address: funderAddress,
    });

    // Index the above transfer
    await waitForAnnouncementsBackfill();

    const senderBalanceBefore = await getTestUserBalance({
      tokenId: 'eth',
    });

    await send({
      amount,
      tokenId: 'eth',
      to: '0x06D35f6B8Fb9Ad47A866052b6a6C3c2DcD1C36F1',
      numInputs: 1,
      chainId,
    });

    // Revert the blocks
    await testClient.revert({ id: snapshot });

    const senderBalanceAfter = await getTestUserBalance({
      tokenId: 'eth',
    });

    expect(senderBalanceAfter).toEqual(senderBalanceBefore);

    unwatch();
  });
});
