import { expect, test } from 'vitest';
import { createCaller } from '@raylac/api';
import {
  getGasInfo,
  getSpendingPrivKey,
  getTokenAddressOnChain,
  getUserOpHash,
  getViewingPrivKey,
  RAYLAC_PAYMASTER_ADDRESS,
  signUserOpWithStealthAccount,
  StealthAddressWithEphemeral,
} from '@raylac/shared';
import { buildMultiChainSendRequestBody } from '@raylac/shared/src/multiChainSend';
import { parseUnits, Hex } from 'viem';
import { base } from 'viem/chains';
import { encodePaymasterAndData } from '@raylac/shared/src/utils';
import prisma from '../lib/prisma';

const context = {
  userId: 97,
  isDevMode: false,
};

const caller = createCaller(context);

const mnemonic = process.env.TEST_ACCOUNT_MNEMONIC as string;

if (!mnemonic) {
  throw new Error('Mnemonic not found');
}

const buildRequestBody = async ({
  amount,
  tokenId,
  to,
}: {
  amount: bigint;
  tokenId: string;
  to: Hex;
}) => {
  const spendingPrivKey = await getSpendingPrivKey(mnemonic);
  const viewingPrivKey = await getViewingPrivKey(mnemonic);

  const addressBalancePerChain = await caller.getAddressBalancesPerChain();

  const gasInfo = await getGasInfo({
    isDevMode: context.isDevMode,
  });

  const user = await caller.getUser({
    userId: context.userId,
  });

  if (!user) {
    throw new Error('User not found');
  }

  const stealthAccounts = await caller.getStealthAccounts();

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
        data: await caller.signUserOp({ userOp }),
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

test('should be able to send eth', async () => {
  const user = await caller.getUser({
    userId: context.userId,
  });

  if (!user) {
    throw new Error('User not found');
  }

  const amount = parseUnits('0.00001', 18);
  const tokenId = 'eth';

  const to = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';

  const userOps = await buildRequestBody({
    amount,
    tokenId,
    to,
  });

  expect(userOps.length).toEqual(1);

  const userOp = userOps[0];

  await caller.submitUserOperation({ userOp });

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
  expect(transfer!.fromUserId).toEqual(context.userId);
  expect(transfer!.toAddress).toEqual(to);

  await checkTx({
    txHash: savedUserOp!.transactionHash as Hex,
    chainId: base.id,
  });
});

test('should be able to send erc20', async () => {
  const amount = parseUnits('0.01', 6);
  const tokenId = 'usdc';

  const to = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';

  const userOps = await buildRequestBody({
    amount,
    tokenId,
    to,
  });

  const userOp = userOps[0];

  await caller.submitUserOperation({ userOp });

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
  expect(transfer!.fromUserId).toEqual(context.userId);
  expect(transfer!.toAddress).toEqual(to);

  await checkTx({
    txHash: savedUserOp!.transactionHash as Hex,
    chainId: base.id,
  });
});
