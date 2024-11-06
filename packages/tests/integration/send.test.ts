import 'dotenv/config';
import { beforeAll, expect, test } from 'vitest';
import {
  AddressTokenBalance,
  getGasInfo,
  getSpendingPrivKey,
  getViewingPrivKey,
  RAYLAC_PAYMASTER_ADDRESS,
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
import { MNEMONIC, signInAsTestUser } from '../lib/auth';
import { getAddressBalance } from '../lib/utils';
import { CoingeckoTokenPriceResponse } from '@raylac/shared/src/types';

const IS_DEV_MODE = false;
const chainId = base.id;

const buildRequestBody = async ({
  amount,
  tokenId,
  to,
  userId,
  numInputs,
  bearerToken,
}: {
  amount: bigint;
  tokenId: string;
  to: Hex;
  userId: number;
  numInputs: number;
  bearerToken: string;
}) => {
  const spendingPrivKey = getSpendingPrivKey(MNEMONIC);
  const viewingPrivKey = getViewingPrivKey(MNEMONIC);

  const authedClient = getAuthedClient(bearerToken);

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

  const user = await authedClient.getUser.query({
    userId,
  });

  if (!user) {
    throw new Error('User not found');
  }

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
        paymaster: RAYLAC_PAYMASTER_ADDRESS,
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

  return signedUserOps;
};

const getSenderBalance = async ({
  tokenId,
  bearerToken,
}: {
  tokenId: string;
  bearerToken: string;
}) => {
  const authedClient = getAuthedClient(bearerToken);
  const senderTokenBalances = await authedClient.getTokenBalances.query();

  const senderBalance = senderTokenBalances.find(
    balance => balance.tokenId === tokenId
  )?.balance;

  if (!senderBalance) {
    throw new Error(`Sender does not have ${tokenId} balance`);
  }

  return BigInt(senderBalance);
};

describe('send', () => {
  let token;
  let userId;
  let tokenPrices: CoingeckoTokenPriceResponse;

  beforeAll(async () => {
    const { userId: _userId, token: _token } = await signInAsTestUser();

    tokenPrices = await client.getTokenPrices.query();

    token = _token;
    userId = _userId;
  });

  for (const tokenId of supportedTokens.map(token => token.tokenId)) {
    for (const numInputs of [1, 2]) {
      test(`should be able to send ${tokenId} with ${numInputs} inputs`, async () => {
        const authedClient = getAuthedClient(token);
        const user = await authedClient.getUser.query({
          userId,
        });

        if (!user) {
          throw new Error('User not found');
        }

        const tokenPrice =
          tokenId === 'usdc'
            ? { usd: 1 }
            : tokenPrices[toCoingeckoTokenId(tokenId)];

        if (!tokenPrice) {
          throw new Error(`Token price not found for ${tokenId}`);
        }

        const tokenMeta = supportedTokens.find(
          token => token.tokenId === tokenId
        );

        if (!tokenMeta) {
          throw new Error(`Token metadata not found for ${tokenId}`);
        }

        const amountFormatted = (0.01 / tokenPrice.usd).toString();

        const amount = parseUnits(amountFormatted, tokenMeta.decimals);

        const to = '0x06D35f6B8Fb9Ad47A866052b6a6C3c2DcD1C36F1';

        const senderBalanceBefore = await getSenderBalance({
          tokenId,
          bearerToken: token,
        });

        const recipientBalanceBefore = await getAddressBalance({
          tokenId,
          address: to,
          chainId: chainId,
        });

        const signedUserOps = await buildRequestBody({
          amount,
          tokenId,
          to,
          userId,
          numInputs,
          bearerToken: token,
        });

        await authedClient.submitUserOps.mutate({
          userOps: signedUserOps,
          tokenPrice: tokenPrice.usd,
        });

        const senderBalanceAfter = await getSenderBalance({
          tokenId,
          bearerToken: token,
        });

        expect(senderBalanceAfter).toEqual(senderBalanceBefore - amount);

        const recipientBalanceAfter = await getAddressBalance({
          tokenId,
          address: to,
          chainId: chainId,
        });

        expect(recipientBalanceAfter).toEqual(recipientBalanceBefore + amount);
      });
    }
  }
});
