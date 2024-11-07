import 'dotenv/config';
import { expect, test } from 'vitest';
import {
  AddressTokenBalance,
  getGasInfo,
  getSpendingPrivKey,
  getViewingPrivKey,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  signUserOpWithStealthAccount,
  StealthAddressWithEphemeral,
  supportedTokens,
  toCoingeckoTokenId,
} from '@raylac/shared';
import { buildMultiChainSendRequestBody } from '@raylac/shared/src/multiChainSend';
import { parseUnits, Hex } from 'viem';
import { base } from 'viem/chains';
import { encodePaymasterAndData } from '@raylac/shared/src/utils';
import { client, getAuthedClient } from '../lib/rpc';
import { describe } from 'node:test';
import { getAddressBalance } from '../lib/utils';
import { TEST_ACCOUNT_MNEMONIC } from '../lib/auth';

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
    chainIds: [chainId],
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
});
