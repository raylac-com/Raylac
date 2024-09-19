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
  UserOperation,
  getTokenAddressOnChain,
  getWalletClient,
  ERC20Abi,
  getTokenBalance,
  NATIVE_TOKEN_ADDRESS,
  decodeUserOpCalldata,
} from '@raylac/shared';
import { webcrypto } from 'node:crypto';
import * as chains from 'viem/chains';
import { signInWithMnemonic } from './auth';
import { getAuthedClient } from './rpc';
import { encodeFunctionData, Hex, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const mnemonic =
  'first flat achieve eight course potato common idea fuel brief torch album';

const FUNDER_PRIV_KEY = process.env.FUNDER_PRIV_KEY as Hex;

if (!FUNDER_PRIV_KEY) {
  throw new Error('Funder private key not found');
}

const funderAccount = privateKeyToAccount(FUNDER_PRIV_KEY);

/**
 * Fund an address on a chain
 */
const fundAddress = async ({
  address,
  chainId,
  amount,
  tokenId,
}: {
  address: Hex;
  chainId: number;
  amount: bigint;
  tokenId: string;
}) => {
  console.log(
    `Funding ${address} with ${amount} ${tokenId} on chain ${chainId}`
  );

  const client = getWalletClient({
    chainId,
  });

  const tokenAddress = getTokenAddressOnChain({
    chainId,
    tokenId,
  });

  let txHash: Hex;
  if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
    txHash = await client.sendTransaction({
      account: funderAccount,
      to: address,
      value: amount,
    });
  } else {
    const transferCall = encodeFunctionData({
      abi: ERC20Abi,
      functionName: 'transfer',
      args: [address, amount],
    });

    txHash = await client.sendTransaction({
      account: funderAccount,
      to: tokenAddress,
      data: transferCall,
    });
  }

  console.log(
    `Funded ${address} with ${amount} ${tokenId} on chain ${chainId}`
  );

  return txHash;
};

const testMultiChainSend = async () => {
  const spendingPrivKey = await getSpendingPrivKey(mnemonic);
  const viewingPrivKey = await getViewingPrivKey(mnemonic);

  const { userId, token } = await signInWithMnemonic({
    mnemonic,
  });

  const authedClient = getAuthedClient(token);

  const stealthAccounts = await authedClient.getStealthAccounts.query();

  const addressBalancePerChain =
    await authedClient.getAddressBalancesPerChain.query();

  const signedInUser = await authedClient.getUser.query({
    userId,
  });

  if (!signedInUser) {
    throw new Error('User not found');
  }

  const tokenId = 'eth';
  const to = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';
  const amount = parseUnits('0.0001', 18);

  const testCases = [
    {
      // Transfer from two accounts on Optimism Sepolia to Base Sepolia
      inputAccounts: addressBalancePerChain
        // Get two accounts on Optimism Sepolia
        .filter(
          account =>
            account.chainId === chains.optimismSepolia.id &&
            account.tokenId === tokenId
        )
        .slice(0, 2)
        .map(account => ({
          ...account,
          // Set the balance to half the amount so that the transfer is made from two accounts
          balance: (BigInt(amount) - BigInt(1)).toString(),
        })),
      outputChain: chains.baseSepolia.id,
      tokenId,
    },
    /*
    {
      // Transfer from Optimism Sepolia and Base Sepolia to Optimism Sepolia
      inputAccounts: [
        // Get one account from each chain
        addressBalancePerChain.find(
          account =>
            account.chainId === chains.optimismSepolia.id &&
            account.tokenId === tokenId
        )!,
        addressBalancePerChain.find(
          account =>
            account.chainId === chains.baseSepolia.id &&
            account.tokenId === tokenId
        )!,
      ].map(account => ({
        ...account,
        // Set the balance to lower than the amount so that the transfer is made from multiple accounts
        balance: (BigInt(amount) - BigInt(1)).toString(),
      })),
      outputChain: chains.optimismSepolia.id,
      tokenId: 'eth',
    },
    {
      // Transfer from two accounts on Base Sepolia to Base Sepolia
      inputAccounts: addressBalancePerChain
        // Get two accounts on Optimism Sepolia
        .filter(
          account =>
            account.chainId === chains.baseSepolia.id &&
            account.tokenId === tokenId
        )
        .slice(0, 2)
        .map(account => ({
          ...account,
          // Set the balance to lower than the amount so that the transfer is made from multiple accounts
          balance: (BigInt(amount) - BigInt(1)).toString(),
        })),
      outputChain: chains.baseSepolia.id,
      tokenId: 'eth',
    },
    {
      // Transfer from two accounts on Optimism Sepolia and Base Sepolia to Arbitrum Sepolia
      inputAccounts: [
        // Get one account from each chain
        addressBalancePerChain.find(
          account =>
            account.chainId === chains.optimismSepolia.id &&
            account.tokenId === tokenId
        )!,
        addressBalancePerChain.find(
          account =>
            account.chainId === chains.baseSepolia.id &&
            account.tokenId === tokenId
        )!,
      ].map(account => ({
        ...account,
        // Set the balance to lower than the amount so that the transfer is made from multiple accounts
        balance: (BigInt(amount) - BigInt(1)).toString(),
      })),
      outputChain: chains.arbitrumSepolia.id,
      tokenId: 'eth',
    },
    */
  ];

  for (const testCase of testCases) {
    /**
     * 1. Build the multi-chain send request body
     *  This will return the user operations that need to be signed
     *  and the stealth account that the funds will be consolidated to
     * after the bridge
     * */

    const multiChainSendData = await buildMultiChainSendRequestBody({
      senderPubKeys: {
        spendingPubKey: signedInUser.spendingPubKey as Hex,
        viewingPubKey: signedInUser.viewingPubKey as Hex,
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
      })),
      outputChainId: testCase.outputChain,
      tokenId: testCase.tokenId,
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
      multiChainSendData.aggregationUserOps.map(async userOp => {
        return getPaymasterAndData({ userOp });
      })
    );

    const paymasterSignedFinalTransferUserOp = await getPaymasterAndData({
      userOp: multiChainSendData.finalTransferUserOp,
    });

    /**
     * 3. Sign the user operations with the stealth accounts
     */

    const signedBridgeUserOps = await bulkSignUserOps({
      userOps: paymasterSignedBridgeUserOps,
      stealthAccounts: stealthAccounts as StealthAddressWithEphemeral[],
      spendingPrivKey,
      viewingPrivKey,
    });

    const signedFinalTransferUserOp = await signUserOpWithStealthAccount({
      userOp: paymasterSignedFinalTransferUserOp,
      stealthAccount: multiChainSendData.consolidateToStealthAccount,
      spendingPrivKey,
      viewingPrivKey,
    });

    // Fund the input accounts if necessary
    await Promise.all(
      signedBridgeUserOps.map(async userOp => {
        // Get the balance of the account
        const balance = await getTokenBalance({
          address: userOp.sender,
          chainId: userOp.chainId,
          tokenAddress: getTokenAddressOnChain({
            chainId: userOp.chainId,
            tokenId: tokenId,
          }),
        });

        // TODO: Decode ERC20 transfer calldata when the user operation is an ERC20 transfer
        const decodedCalldata = decodeUserOpCalldata(userOp);

        if (balance < BigInt(decodedCalldata.value)) {
          await fundAddress({
            address: userOp.sender,
            chainId: userOp.chainId,
            amount: decodedCalldata.value,
            tokenId: testCase.tokenId,
          });
        } else {
          console.log(
            `Account ${userOp.sender} has enough funds on chain ${userOp.chainId}`
          );
        }
      })
    );

    await authedClient.send.mutate({
      aggregationUserOps: signedBridgeUserOps,
      finalTransferUserOp: signedFinalTransferUserOp,
      relayQuotes: multiChainSendData.relayQuotes,
      proxyStealthAccount: multiChainSendData.consolidateToStealthAccount,
    });
  }
};

testMultiChainSend();
