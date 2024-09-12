import { getMnemonic, getSpendingPrivKey, getViewingPrivKey } from '@/lib/key';
import { trpc } from '@/lib/trpc';
import { publicClient } from '@/lib/viem';
import { RouterOutput, User } from '@/types';
import {
  ERC20Abi,
  NATIVE_TOKEN_ADDRESS,
  RAYLAC_PAYMASTER_ADDRESS,
  RelayGetQuoteRequestBody,
  UserOperation,
  buildUserOp,
  encodePaymasterAndData,
  generateStealthAddress,
  getAlchemyRpcUrl,
  getChainFromId,
  getPublicClient,
  getQuoteFromRelay,
  getSenderAddress,
  getUserOpHash,
  recoveryStealthPrivKey,
} from '@raylac/shared';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { useCallback } from 'react';
import { Hex, encodeFunctionData } from 'viem';
import { publicKeyToAddress, signMessage } from 'viem/accounts';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const buildUserOpsFromRelayQuote = async ({
  signerAddress,
  toAddress,
  inputChainId,
  inputTokenId,
  outputChainId,
  outputTokenId,
  amount,
}) => {
  const inputTokenAddress = supportedTokens
    .find(token => token.tokenId === inputTokenId)
    ?.addresses.find(
      tokenAddress => tokenAddress.chain.id === inputChainId
    ).address;

  const outputTokenAddress = supportedTokens
    .find(token => token.tokenId === outputTokenId)
    ?.addresses.find(
      tokenAddress => tokenAddress.chain.id === outputChainId
    ).address;

  const fromAddress = getSenderAddress({
    stealthSigner: signerAddress,
  });

  const relayQuoteRequestBody = {
    user: fromAddress,
    recipient: toAddress,
    originChainId: inputChainId,
    destinationChainId: outputChainId,
    amount: amount.toString(),
    originCurrency: inputTokenAddress,
    destinationCurrency: outputTokenAddress,
    tradeType: 'EXACT_INPUT' as RelayGetQuoteRequestBody['tradeType'],
  };

  const quote = await getQuoteFromRelay(relayQuoteRequestBody);

  const inputChain = getChainFromId(inputChainId);

  // Build user operations from the steps specified in the Relay quote
  const userOps = (
    await Promise.all(
      quote.steps.map(async step => {
        console.log(step.id, step.action, step.description);
        const client = getPublicClient({
          chain: inputChain,
          rpcUrl: getAlchemyRpcUrl({ chain: inputChain }),
        });

        return await Promise.all(
          step.items.map(item => {
            console.log(item);
            console.log('item.data', item.data);
            return buildUserOp({
              client,
              stealthSigner: signerAddress,
              to: item.data.to,
              value: BigInt(item.data.value),
              data: item.data.data,
            });
          })
        );
      })
    )
  ).flat();

  return userOps;
};

/**
 * Hook to build and send user operations
 */
const useSend = () => {
  const { data: tokenBalancePerChain } =
    trpc.getTokenBalancesPerChain.useQuery();
  const { mutateAsync: send } = trpc.send.useMutation();
  const { mutateAsync: signUserOp } = trpc.signUserOp.useMutation();

  const queryClient = useQueryClient();

  /**
   * Get the `paymasterAndData` field for a user operation
   */
  const getPaymasterAndData = useCallback(
    async ({ userOp }: { userOp: UserOperation }) => {
      return encodePaymasterAndData({
        paymaster: RAYLAC_PAYMASTER_ADDRESS,
        data: await signUserOp({ userOp }),
      });
    },
    [signUserOp]
  );

  const signUserOpWithStealthAccount = useCallback(
    async ({
      userOp,
      stealthPrivKey,
      chainId,
    }: {
      userOp: UserOperation;
      stealthPrivKey: Hex;
      chainId: number;
    }) => {
      const chain = getChainFromId(chainId);

      const client = getPublicClient({
        chain,
        rpcUrl: getAlchemyRpcUrl({ chain }),
      });

      const userOpHash = await getUserOpHash({
        client,
        userOp,
      });

      const sig = await signMessage({
        privateKey: stealthPrivKey,
        message: {
          raw: userOpHash,
        },
      });

      return sig;
    },
    []
  );

  return useMutation({
    mutationFn: async ({
      amount,
      inputTokenId,
      outputTokenId,
      outputChainId,
      recipientUserOrAddress,
    }: {
      amount: bigint;
      inputTokenId: string;
      outputTokenId: string;
      outputChainId: number;
      recipientUserOrAddress: Hex | User;
    }) => {
      if (!tokenBalancePerChain) {
        throw new Error('Token balances not loaded');
      }

      // Get addresses with the specified token balance
      const sortedAccountsWithToken = tokenBalancePerChain
        .filter(balance => balance.tokenId)
        .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

      let currentAmount = BigInt(0);
      const sendFromAccounts: RouterOutput['getTokenBalancesPerChain'] = [];

      for (const account of sortedAccountsWithToken) {
        sendFromAccounts.push(account);
        currentAmount += BigInt(account.balance);

        if (currentAmount >= amount) {
          break;
        }
      }

      if (currentAmount < amount) {
        throw new Error('Not enough funds');
      }

      const mnemonic = await getMnemonic();
      const viewPrivKey = await getViewingPrivKey(mnemonic);
      const spendingPrivKey = await getSpendingPrivKey(mnemonic);

      if (!viewPrivKey) {
        throw new Error('No view key found');
      }

      if (!spendingPrivKey) {
        throw new Error('No spending key found');
      }

      const to =
        typeof recipientUserOrAddress === 'string'
          ? recipientUserOrAddress
          : generateStealthAddress({
              spendingPubKey: recipientUserOrAddress.spendingPubKey as Hex,
              viewingPubKey: recipientUserOrAddress.viewingPubKey as Hex,
            });

      const toAddress = typeof to === 'string' ? to : to.address;

      let remainingAmount = amount;

      const userOps: UserOperation[] = [];
      for (const sendFromAccount of sendFromAccounts) {
        const accountBalance = BigInt(sendFromAccount.balance);

        // Determine the amount to send from this account
        const sendAmount =
          remainingAmount > accountBalance ? accountBalance : remainingAmount;

        const stealthSigner = publicKeyToAddress(
          sendFromAccount.stealthAddress.stealthPubKey as Hex
        );

        // Get the metadata of the input token
        const inputTokenMetadata = supportedTokens
          .find(token => token.tokenId === inputTokenId)
          ?.addresses.find(
            tokenAddress => tokenAddress.chain.id === sendFromAccount.chain.id
          );

        // Recover the stealth private key for the account
        const stealthPrivKey = recoveryStealthPrivKey({
          ephemeralPubKey: sendFromAccount.stealthAddress
            .ephemeralPubKey as Hex,
          viewingPrivKey: viewPrivKey as Hex,
          spendingPrivKey: spendingPrivKey as Hex,
        });

        if (
          sendFromAccount.chain.id !== outputChainId ||
          inputTokenId !== outputTokenId
        ) {
          // The transfer involves a cross-chain or cross-token transfer
          console.log('Cross-chain or cross-token transfer');

          // Build user operations from the Relay quote
          const unsignedUserOps = await buildUserOpsFromRelayQuote({
            signerAddress: stealthSigner,
            toAddress,
            inputChainId: sendFromAccount.chain.id,
            inputTokenId,
            outputChainId,
            outputTokenId,
            amount: sendAmount,
          });

          // Attach `paymasterAndData` and `signature` to each user operation
          for (const userOp of unsignedUserOps) {
            console.log('GEtting paymaster and data');
            userOp.paymasterAndData = await getPaymasterAndData({ userOp });

            console.log('Signing user op with stealth account');
            const sig = await signUserOpWithStealthAccount({
              userOp,
              stealthPrivKey,
              chainId: sendFromAccount.chain.id,
            });
            console.log('got sig');

            userOp.signature = sig;
            userOps.push(userOp);
          }
        } else {
          let userOp: UserOperation;
          if (inputTokenMetadata.address === NATIVE_TOKEN_ADDRESS) {
            // This is a native token transfer
            // Build a user operation to send native tokens
            userOp = await buildUserOp({
              client: publicClient,
              stealthSigner,
              value: sendAmount,
              to: toAddress,
              data: '0x',
            });
          } else {
            // This is an ERC20 token transfer
            // Build a user operation to send ERC20 tokens
            const transferCall = encodeFunctionData({
              abi: ERC20Abi,
              functionName: 'transfer',
              args: [toAddress, sendAmount],
            });

            userOp = await buildUserOp({
              client: publicClient,
              stealthSigner,
              value: BigInt(0),
              to: inputTokenMetadata.address,
              data: transferCall,
            });
          }

          userOp.paymasterAndData = await getPaymasterAndData({ userOp });

          const sig = await signUserOpWithStealthAccount({
            userOp,
            stealthPrivKey,
            chainId: sendFromAccount.chain.id,
          });

          userOp.signature = sig;

          userOps.push(userOp);
        }

        remainingAmount -= sendAmount;
      }

      // TODO: Publish the Stealth address ephemeral data if this is a transfer to a stealth address

      console.log('Sending user ops', userOps);
      await send({
        userOps,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getBalance),
      });
    },
  });
};

export default useSend;
