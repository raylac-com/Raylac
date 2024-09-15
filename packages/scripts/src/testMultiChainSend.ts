import 'dotenv/config';
import {
  buildMultiChainSendRequestBody,
  bulkSignUserOps,
  encodePaymasterAndData,
  getSpendingPrivKey,
  getViewingPrivKey,
  RAYLAC_PAYMASTER_ADDRESS,
  signUserOpWithStealthAccount,
  StealthAddressWithEphemeral,
  TokenBalance,
  UserOperation,
} from '@raylac/shared';
import { webcrypto } from 'node:crypto';
import * as chains from 'viem/chains';
import { signInWithMnemonic } from './auth';
import { getAuthedClient } from './rpc';
import { Hex, parseUnits } from 'viem';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const mnemonic =
  'first flat achieve eight course potato common idea fuel brief torch album';

const testMultiChainSend = async () => {
  const spendingPrivKey = await getSpendingPrivKey(mnemonic);
  const viewingPrivKey = await getViewingPrivKey(mnemonic);

  const { userId, token } = await signInWithMnemonic({
    mnemonic,
  });

  const authedClient = getAuthedClient(token);

  const stealthAccounts = await authedClient.getStealthAccounts.query();

  const stealthAccountsWithTokenBalances =
    await authedClient.getTokenBalancesPerChain.query();

  const signedInUser = await authedClient.getUser.query({
    userId,
  });

  if (!signedInUser) {
    throw new Error('User not found');
  }

  const outputChainId = chains.optimismSepolia.id;
  const tokenId = 'eth';
  const to = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';
  const amount = parseUnits('0.0001', 18);

  /**
   * 1. Build the multi-chain send request body
   *   This will return the user operations that need to be signed
   *  and the stealth account that the funds will be consolidated to
   * after the bridge
   * */

  const multiChainSendData = await buildMultiChainSendRequestBody({
    senderPubKeys: {
      spendingPubKey: signedInUser.spendingPubKey as Hex,
      viewingPubKey: signedInUser.viewingPubKey as Hex,
    },
    stealthAccountsWithTokenBalances:
      stealthAccountsWithTokenBalances as TokenBalance[],
    outputChainId,
    tokenId,
    to,
    amount,
  });

  /**
   * Get the `paymasterAndData` field for a user operation
   */
  const getPaymasterAndData = async ({
    userOp,
  }: {
    userOp: UserOperation;
  }): Promise<UserOperation> => {
    const paymasterSig = encodePaymasterAndData({
      paymaster: RAYLAC_PAYMASTER_ADDRESS,
      data: await authedClient.signUserOp.mutate({ userOp }),
    });

    return {
      ...userOp,
      paymasterAndData: paymasterSig,
    };
  };

  /**
   * 2. Get the paymaster signatures for the user operations
   */

  const paymasterSignedBridgeUserOps = await Promise.all(
    multiChainSendData.bridgeUserOps.map(async userOp => {
      return getPaymasterAndData({ userOp });
    })
  );

  const paymasterSignedUserOpsAfterBridge = await Promise.all(
    multiChainSendData.userOpsAfterBridge.map(async userOp => {
      return getPaymasterAndData({ userOp });
    })
  );

  const paymasterSignedFinalTransferUserOp = await getPaymasterAndData({
    userOp: multiChainSendData.finalTransferUserOp,
  });

  console.log({
    paymasterSignedBridgeUserOps,
    paymasterSignedUserOpsAfterBridge,
    paymasterSignedFinalTransferUserOp,
  });

  console.log(`Signing bridge user ops...`);
  const signedBridgeUserOps = await bulkSignUserOps({
    userOps: paymasterSignedBridgeUserOps,
    stealthAccounts: stealthAccounts as StealthAddressWithEphemeral[],
    spendingPrivKey,
    viewingPrivKey,
  });

  console.log(`Signing user ops after bridge...`);
  const signedUserOpsAfterBridge = await bulkSignUserOps({
    userOps: paymasterSignedUserOpsAfterBridge,
    stealthAccounts: stealthAccounts as StealthAddressWithEphemeral[],
    spendingPrivKey,
    viewingPrivKey,
  });

  console.log(`Signing final transfer user op...`);
  const signedFinalTransferUserOp = await signUserOpWithStealthAccount({
    userOp: paymasterSignedFinalTransferUserOp,
    stealthAccount: multiChainSendData.consolidateToStealthAccount,
    spendingPrivKey,
    viewingPrivKey,
    chainId: outputChainId,
  });

  await authedClient.send.mutate({
    bridgeUserOps: signedBridgeUserOps,
    userOpsAfterBridge: signedUserOpsAfterBridge,
    finalTransferUserOp: signedFinalTransferUserOp,
    relayQuotes: multiChainSendData.relayQuotes,
  });
};

testMultiChainSend();
