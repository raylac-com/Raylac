import 'dotenv/config';
import { beforeAll, expect, test } from 'vitest';
import {
  getGasInfo,
  getSpendingPrivKey,
  getTokenAddressOnChain,
  getUserOpHash,
  getViewingPrivKey,
  RAYLAC_PAYMASTER_ADDRESS,
  signUserOpWithStealthAccount,
  StealthAddressWithEphemeral,
  submitUserOpWithRetry,
  toCoingeckoTokenId,
} from '@raylac/shared';
import { buildMultiChainSendRequestBody } from '@raylac/shared/src/multiChainSend';
import { parseUnits, Hex } from 'viem';
import { baseSepolia } from 'viem/chains';
import { encodePaymasterAndData } from '@raylac/shared/src/utils';
import prisma from '../lib/prisma';
import { client, getAuthedClient } from '../lib/rpc';
import { describe } from 'node:test';
import { MNEMONIC, signInAsTestUser } from '../lib/auth';
import { getAddressBalance } from '../lib/utils';
import supportedTokens from '@raylac/shared/src/supportedTokens';
import { CoingeckoTokenPriceResponse } from '@raylac/shared/src/types';

const IS_DEV_MODE = true;
const chainId = baseSepolia.id;

const buildRequestBody = async ({
  amount,
  tokenId,
  to,
  userId,
  bearerToken,
}: {
  amount: bigint;
  tokenId: string;
  to: Hex;
  userId: number;
  bearerToken: string;
}) => {
  const spendingPrivKey = await getSpendingPrivKey(MNEMONIC);
  const viewingPrivKey = await getViewingPrivKey(MNEMONIC);

  const authedClient = getAuthedClient(bearerToken);

  const addressBalancePerChain =
    await authedClient.getAddressBalancesPerChain.query();

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

  const requestBody = await buildMultiChainSendRequestBody({
    senderPubKeys: {
      spendingPubKey: user.spendingPubKey as Hex,
      viewingPubKey: user.viewingPubKey as Hex,
    },
    stealthAccountsWithTokenBalances: addressBalancePerChain.map(account => ({
      tokenId: account.tokenId!,
      balance: account.balance!,
      chainId: account.chainId!,
      tokenAddress: getTokenAddressOnChain({
        chainId: account.chainId,
        tokenId,
      }),
      stealthAddress: stealthAccounts.find(
        stealthAccount => stealthAccount.address === account.address
      ) as StealthAddressWithEphemeral,
      nonce: account.nonce,
    })),
    gasInfo,
    amount,
    outputChainId: chainId,
    to,
    tokenId,
  });

  const signedUserOps = await Promise.all(
    requestBody.aggregationUserOps.map(async userOp => {
      // Get the paymaster signature
      const paymasterAndData = encodePaymasterAndData({
        paymaster: RAYLAC_PAYMASTER_ADDRESS,
        data: await authedClient.signUserOp.mutate({ userOp }),
      });
      userOp.paymasterAndData = paymasterAndData;

      const stealthAccount = stealthAccounts.find(
        stealthAccount => stealthAccount.address === userOp.sender
      );

      if (!stealthAccount) {
        throw new Error('Stealth account not found');
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

const checkTx = async ({
  txHash,
  chainId,
}: {
  txHash: Hex;
  chainId: number;
}) => {
  const transaction = await prisma.transaction.findUnique({
    select: {
      block: {
        select: {
          number: true,
          chainId: true,
        },
      },
    },
    where: {
      hash: txHash,
    },
  });

  expect(transaction).not.toBeNull();
  expect(transaction?.block?.number).not.toBeNull();
  expect(transaction?.block?.chainId).toEqual(chainId);
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
    test.concurrent(`should be able to send ${tokenId}`, async () => {
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

      const to = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';

      const senderBalanceBefore = await getSenderBalance({
        tokenId,
        bearerToken: token,
      });

      const recipientBalanceBefore = await getAddressBalance({
        tokenId,
        address: to,
        chainId: chainId,
      });

      const userOps = await buildRequestBody({
        amount,
        tokenId,
        to,
        userId,
        bearerToken: token,
      });

      expect(userOps.length).toEqual(1);

      const userOp = userOps[0];

      const stealthAccounts = await authedClient.getStealthAccounts.query();

      const spendingPrivKey = await getSpendingPrivKey(MNEMONIC);
      const viewingPrivKey = await getViewingPrivKey(MNEMONIC);

      const userOpHash = await submitUserOpWithRetry({
        signAndSubmitUserOp: async userOp => {
          const paymasterAndData = encodePaymasterAndData({
            paymaster: RAYLAC_PAYMASTER_ADDRESS,
            data: await authedClient.signUserOp.mutate({ userOp }),
          });
          userOp.paymasterAndData = paymasterAndData;

          const stealthAccount = stealthAccounts.find(
            stealthAccount => stealthAccount.address === userOp.sender
          );

          if (!stealthAccount) {
            throw new Error('Stealth account not found');
          }

          // Sign the user operation with the stealth account
          const signedUserOp = await signUserOpWithStealthAccount({
            userOp,
            stealthAccount: stealthAccount as StealthAddressWithEphemeral,
            spendingPrivKey,
            viewingPrivKey,
          });

          await authedClient.submitUserOperation.mutate({
            userOp: signedUserOp,
          });

          return getUserOpHash({ userOp: signedUserOp });
        },
        userOp,
      });

      // 1. Check that the user operation is correctly saved in the db.
      const savedUserOp = await prisma.userOperation.findUnique({
        where: {
          hash: userOpHash,
        },
      });

      expect(
        savedUserOp,
        `User operation not found for ${userOpHash}`
      ).not.toBeNull();
      expect(
        savedUserOp?.sender,
        `Sender does not match for ${userOpHash}`
      ).toEqual(userOp.sender);
      expect(
        savedUserOp?.nonce,
        `Nonce does not match for ${userOpHash}`
      ).toEqual(parseInt(userOp.nonce, 16));
      expect(
        savedUserOp?.chainId,
        `Chain ID does not match for ${userOpHash}`
      ).toEqual(chainId);

      // 2. Check that the trace is correctly saved in the db.
      const traces = await prisma.trace.findMany({
        select: {
          from: true,
          to: true,
          tokenId: true,
          amount: true,
          transferId: true,
        },
        where: {
          transactionHash: savedUserOp!.transactionHash as string,
        },
      });

      expect(traces.length).toEqual(1);
      const trace = traces[0];

      expect(trace.from).toEqual(userOp.sender);
      expect(trace.to).toEqual(to);
      expect(trace.tokenId).toEqual(tokenId);
      expect(trace.amount).toEqual(amount);

      const transferId = trace.transferId;

      // 3. Check that the transfer is correctly saved in the db.
      const transfer = await prisma.transfer.findUnique({
        where: {
          transferId,
        },
      });

      expect(transfer).not.toBeNull();
      expect(transfer!.fromUserId).toEqual(userId);
      expect(transfer!.toAddress).toEqual(to);

      await checkTx({
        txHash: savedUserOp!.transactionHash as Hex,
        chainId: chainId,
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
});
