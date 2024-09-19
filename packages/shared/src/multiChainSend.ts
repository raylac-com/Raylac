import { encodeFunctionData, Hex, toHex } from 'viem';
import {
  MultiChainTransferRequestBody,
  RelayGetQuoteResponseBody,
  StealthAddressWithEphemeral,
  TokenBalance,
  UserOperation,
} from './types';
import { generateStealthAddress } from './stealth';
import { buildUserOp } from './erc4337';
import { getPublicClient } from './ethRpc';
import { publicKeyToAddress } from 'viem/accounts';
import { getTokenAddressOnChain } from './utils';
import ERC20Abi from './abi/ERC20Abi';
import { NATIVE_TOKEN_ADDRESS, relay } from '.';

interface InputStealthAccount {
  stealthAccount: StealthAddressWithEphemeral;
  chainId: number;
  amount: bigint;
}

/**
 * Turn all steps in a Relay quote into executable user operations
 */
const buildUserOpsFromRelayQuote = async ({
  stealthSigner,
  quote,
  tag,
}: {
  stealthSigner: Hex;
  quote: RelayGetQuoteResponseBody;
  tag: Hex;
}) => {
  const userOps = (
    await Promise.all(
      // Build user operations from the steps specified in the Relay quote
      quote.steps.map(async step => {
        return await Promise.all(
          step.items.map(item => {
            console.log('Building user op for:', item);
            const client = getPublicClient({
              chainId: item.data.chainId,
            });

            return buildUserOp({
              client,
              stealthSigner,
              to: item.data.to,
              value: BigInt(item.data.value),
              data: item.data.data,
              tag,
            });
          })
        );
      })
    )
  ).flat();

  return userOps;
};

/**
 * Pick the stealth accounts to use as inputs for a transfer.
 * This functions chooses the stealth accounts in the following priority:
 * 1. Stealth accounts that are on the same chain as the output chain
 * 2. Stealth accounts with token balance more than the transfer amount
 */
const chooseInputStealthAccounts = ({
  outputTokenId,
  outputChainId,
  amount,
  stealthAccountsWithTokenBalances,
}: {
  outputTokenId: string;
  outputChainId: number;
  amount: bigint;
  stealthAccountsWithTokenBalances: TokenBalance[];
}): InputStealthAccount[] => {
  // TODO: Only choose mainnet accounts if the output chain is mainnet

  // Filter out stealth accounts with non-zero balance of the output token
  const accountsWithNonZeroTokenBalances =
    stealthAccountsWithTokenBalances.filter(
      stealthAccount =>
        stealthAccount.tokenId === outputTokenId &&
        stealthAccount.balance !== '0'
    );

  // 1. Search for stealth accounts on the destination chain
  const destinationChainStealthAccounts = accountsWithNonZeroTokenBalances
    .filter(stealthAccount => stealthAccount.chainId === outputChainId)
    // Sort by balance in descending order
    .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

  // Array of stealth accounts that will be used as inputs
  const sendFromAccounts: InputStealthAccount[] = [];

  // Set the remaining amount that needs to be sent.
  // This is subtracted as we find stealth accounts with enough funds.
  let remainingAmount = amount;

  for (const destinationChainStealthAccount of destinationChainStealthAccounts) {
    const balance = BigInt(destinationChainStealthAccount.balance);

    if (balance >= remainingAmount) {
      // The account has more than enough funds to cover the remaining amount
      sendFromAccounts.push({
        stealthAccount: destinationChainStealthAccount.stealthAddress,
        chainId: destinationChainStealthAccount.chainId,
        amount: remainingAmount,
      });
      remainingAmount = BigInt(0);
      break;
    } else {
      sendFromAccounts.push({
        stealthAccount: destinationChainStealthAccount.stealthAddress,
        chainId: destinationChainStealthAccount.chainId,
        amount: balance,
      });
    }

    remainingAmount -= balance;
  }

  if (remainingAmount === BigInt(0)) {
    // There are enough funds on the destination chain.
    // The user can send from accounts from/to the specified destination chain.
    return sendFromAccounts;
  }

  // 3. Search for stealth accounts with enough funds on other chains
  const otherChainStealthAccounts = accountsWithNonZeroTokenBalances
    .filter(stealthAccount => stealthAccount.chainId !== outputChainId)
    // Sort by balance in descending order
    .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

  for (const otherChainStealthAccount of otherChainStealthAccounts) {
    const balance = BigInt(otherChainStealthAccount.balance);

    if (balance >= remainingAmount) {
      sendFromAccounts.push({
        stealthAccount: otherChainStealthAccount.stealthAddress,
        chainId: otherChainStealthAccount.chainId,
        amount: remainingAmount,
      });
      remainingAmount = BigInt(0);
      break;
    } else {
      sendFromAccounts.push({
        stealthAccount: otherChainStealthAccount.stealthAddress,
        chainId: otherChainStealthAccount.chainId,
        amount: balance,
      });
    }

    remainingAmount -= balance;
  }

  console.log('Remaining amount:', remainingAmount);

  if (remainingAmount !== BigInt(0)) {
    throw new Error('Not enough funds');
  }

  return sendFromAccounts;
};

/**
 * Build a `UserOperation` for an ERC20 transfer
 */
export const buildERC20TransferUserOp = async ({
  stealthSigner,
  to,
  tokenAddress,
  amount,
  chainId,
  tag,
}: {
  stealthSigner: Hex;
  to: Hex;
  tokenAddress: Hex;
  amount: bigint;
  chainId: number;
  tag: Hex;
}) => {
  const client = getPublicClient({
    chainId,
  });

  const transferCall = encodeFunctionData({
    abi: ERC20Abi,
    functionName: 'transfer',
    args: [to, amount],
  });

  const userOp = await buildUserOp({
    client,
    stealthSigner,
    value: BigInt(0),
    to: tokenAddress,
    data: transferCall,
    tag,
  });

  return userOp;
};

/**
 * Build a `UserOperation` for an ETH transfer
 */
export const buildETHTransferUserOp = async ({
  stealthSigner,
  to,
  amount,
  chainId,
  tag,
}: {
  stealthSigner: Hex;
  to: Hex;
  amount: bigint;
  chainId: number;
  tag: Hex;
}) => {
  const client = getPublicClient({
    chainId,
  });

  const userOp = await buildUserOp({
    client,
    stealthSigner,
    value: amount,
    to,
    data: '0x',
    tag,
  });

  return userOp;
};

const buildTransferUseOp = async ({
  stealthSigner,
  to,
  tokenAddress,
  amount,
  chainId,
  tag,
}: {
  stealthSigner: Hex;
  to: Hex;
  tokenAddress: Hex;
  amount: bigint;
  chainId: number;
  tag: Hex;
}) => {
  if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
    return buildETHTransferUserOp({
      stealthSigner,
      to,
      amount,
      chainId,
      tag,
    });
  }

  return buildERC20TransferUserOp({
    stealthSigner,
    to,
    tokenAddress,
    amount,
    chainId,
    tag,
  });
};

/**
 * Builds all the user operations required to send a token from one chain to another.
 * The user operations are unsigned.
 */
export const buildMultiChainSendRequestBody = async ({
  senderPubKeys,
  outputChainId,
  tokenId,
  to,
  amount,
  stealthAccountsWithTokenBalances,
}: {
  senderPubKeys: {
    spendingPubKey: Hex;
    viewingPubKey: Hex;
  };
  tokenId: string;
  outputChainId: number;
  to: Hex;
  amount: bigint;
  stealthAccountsWithTokenBalances: TokenBalance[];
}): Promise<MultiChainTransferRequestBody> => {
  const inputs = chooseInputStealthAccounts({
    outputChainId,
    outputTokenId: tokenId,
    amount,
    stealthAccountsWithTokenBalances,
  });

  // Send the funds to the proxy stealth account on the destination chain
  const consolidateToStealthAccount = generateStealthAddress({
    spendingPubKey: senderPubKeys.spendingPubKey as Hex,
    viewingPubKey: senderPubKeys.viewingPubKey as Hex,
  });

  const tokenAddressOnOutputChain = getTokenAddressOnChain({
    chainId: outputChainId,
    tokenId,
  });

  // Create a Uint8Array with 20 bytes
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  const tag = toHex(randomBytes);

  const unsignedBridgeUserOps: UserOperation[] = [];
  const relayQuotes: RelayGetQuoteResponseBody[] = [];
  for (const input of inputs) {
    if (input.chainId === outputChainId) {
      const tokenAddress = getTokenAddressOnChain({
        chainId: input.chainId,
        tokenId,
      });

      console.log(input);

      if (!tokenAddress) {
        throw new Error('Token address not found');
      }

      const stealthSigner = publicKeyToAddress(
        input.stealthAccount.stealthPubKey
      );

      // Build a standard transfer user operation
      console.log('build standard transfer user op');
      const userOp = await buildTransferUseOp({
        stealthSigner,
        to: consolidateToStealthAccount.address,
        tokenAddress,
        amount: input.amount,
        chainId: input.chainId,
        tag,
      });

      unsignedBridgeUserOps.push({
        ...userOp,
        chainId: input.chainId,
      });
    } else {
      // The input and output chains are on different chains.
      // Build a `UserOperation` for bridge transfer.
      const inputTokenAddress = getTokenAddressOnChain({
        chainId: input.chainId,
        tokenId,
      });

      const quote = await relay.getQuote({
        user: input.stealthAccount.address,
        recipient: consolidateToStealthAccount.address,
        originChainId: input.chainId,
        destinationChainId: outputChainId,
        amount: input.amount.toString(),
        originCurrency: inputTokenAddress,
        destinationCurrency: tokenAddressOnOutputChain,
        tradeType: 'EXACT_OUTPUT',
      });

      relayQuotes.push(quote);

      const userOps = await buildUserOpsFromRelayQuote({
        stealthSigner: publicKeyToAddress(input.stealthAccount.stealthPubKey),
        quote,
        tag,
      });

      unsignedBridgeUserOps.push(...userOps);
    }

    console.log(
      `Sending ${input.amount} from ${input.stealthAccount.address} on chain ${input.chainId}`
    );
  }

  const consolidateAccountStealthSigner = publicKeyToAddress(
    consolidateToStealthAccount.stealthPubKey
  );

  console.log('build final transfer user op');
  const finalTransferUserOp = await buildTransferUseOp({
    stealthSigner: consolidateAccountStealthSigner,
    tokenAddress: tokenAddressOnOutputChain,
    to,
    amount,
    chainId: outputChainId,
    tag,
  });

  return {
    aggregationUserOps: unsignedBridgeUserOps,
    finalTransferUserOp,
    consolidateToStealthAccount,
    relayQuotes,
  };
};
