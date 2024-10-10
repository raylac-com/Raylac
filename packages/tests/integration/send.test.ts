import 'dotenv/config';
import { webcrypto } from 'node:crypto';
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
  toCoingeckoTokenId,
} from '@raylac/shared';
import { buildMultiChainSendRequestBody } from '@raylac/shared/src/multiChainSend';
import { parseUnits, Hex } from 'viem';
import { base } from 'viem/chains';
import { encodePaymasterAndData } from '@raylac/shared/src/utils';
import prisma from '../lib/prisma';
import { client, getAuthedClient } from '../lib/rpc';
import { describe } from 'node:test';
import { signInWithMnemonic } from '../lib/auth';
import { getAddressBalance } from '../lib/utils';
import supportedTokens from '@raylac/shared/src/supportedTokens';
import { CoingeckoTokenPriceResponse } from '@raylac/shared/src/types';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const mnemonic = process.env.TEST_ACCOUNT_MNEMONIC as string;

if (!mnemonic) {
  throw new Error('Mnemonic not found');
}

const IS_DEV_MODE = false;

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
  const spendingPrivKey = await getSpendingPrivKey(mnemonic);
  const viewingPrivKey = await getViewingPrivKey(mnemonic);

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
    outputChainId: base.id,
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
    const { userId: _userId, token: _token } = await signInWithMnemonic({
      mnemonic,
    });

    tokenPrices = await client.getTokenPrices.query();

    token = _token;
    userId = _userId;
  });

  for (const tokenId of supportedTokens.map(token => token.tokenId)) {
    test.only(`should be able to send ${tokenId}`, async () => {
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
        chainId: base.id,
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

      await authedClient.submitUserOperation.mutate({ userOp });

      const userOpHash = await getUserOpHash({ userOp });

      // 1. Check that the user operation is correctly saved in the db.
      const savedUserOp = await prisma.userOperation.findUnique({
        where: {
          hash: userOpHash,
        },
      });

      expect(savedUserOp).not.toBeNull();
      expect(savedUserOp?.sender).toEqual(userOp.sender);
      expect(savedUserOp?.nonce).toEqual(parseInt(userOp.nonce, 16));
      expect(savedUserOp?.chainId).toEqual(base.id);

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
        chainId: base.id,
      });

      const senderBalanceAfter = await getSenderBalance({
        tokenId,
        bearerToken: token,
      });

      expect(senderBalanceAfter).toEqual(senderBalanceBefore - amount);

      const recipientBalanceAfter = await getAddressBalance({
        tokenId,
        address: to,
        chainId: base.id,
      });

      expect(recipientBalanceAfter).toEqual(recipientBalanceBefore + amount);
    });
  }

  /*
  test('should be able to send erc20', async () => {
    const authedClient = getAuthedClient(token);
    const amount = parseUnits('0.01', 6);
    const tokenId = 'usdc';

    const to = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';

    const userOps = await buildRequestBody({
      amount,
      tokenId,
      to,
      userId,
      bearerToken: token,
    });

    const userOp = userOps[0];

    await authedClient.submitUserOperation.mutate({ userOp });

    const userOpHash = await getUserOpHash({ userOp });

    // 1. Check that the user operation is correctly saved in the db.
    const savedUserOp = await prisma.userOperation.findUnique({
      where: {
        hash: userOpHash,
      },
    });

    expect(savedUserOp).not.toBeNull();
    expect(savedUserOp?.sender).toEqual(userOp.sender);
    expect(savedUserOp?.nonce).toEqual(parseInt(userOp.nonce, 16));
    expect(savedUserOp?.chainId).toEqual(base.id);

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
      chainId: base.id,
    });
  });
  */
});
