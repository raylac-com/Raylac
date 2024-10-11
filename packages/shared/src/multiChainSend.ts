import { encodeFunctionData, Hex, toHex } from 'viem';
import {
  ChainGasInfo,
  MultiChainTransferRequestBody,
  RelayGetQuoteResponseBody,
  StealthAddressWithEphemeral,
  TokenBalance,
  UserOperation,
} from './types';
import { generateStealthAddress } from './stealth';
import { buildUserOp } from './erc4337';
import { getPublicClient } from './ethRpc';
import { getTokenAddressOnChain } from './utils';
import ERC20Abi from './abi/ERC20Abi';
import { NATIVE_TOKEN_ADDRESS, relay } from '.';

interface InputStealthAccount {
  stealthAccount: StealthAddressWithEphemeral;
  chainId: number;
  amount: bigint;
  nonce: number | null;
}

/**
 * Turn all steps in a Relay quote into executable user operations
 */
const buildUserOpsFromRelayQuote = async ({
  stealthSigner,
  signerNonce,
  gasInfo,
  quote,
  tag,
}: {
  stealthSigner: Hex;
  signerNonce: number | null;
  gasInfo: ChainGasInfo[];
  quote: RelayGetQuoteResponseBody;
  tag: Hex;
}) => {
  const userOps = (
    await Promise.all(
      // Build user operations from the steps specified in the Relay quote
      quote.steps.map(async step => {
        return await Promise.all(
          step.items.map(item => {
            const client = getPublicClient({
              chainId: item.data.chainId,
            });

            return buildUserOp({
              client,
              stealthSigner,
              to: item.data.to,
              nonce: signerNonce,
              value: BigInt(item.data.value),
              data: item.data.data,
              tag,
              gasInfo,
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
  // Filter out stealth accounts with non-zero balance of the output token
  const accountsWithNonZeroTokenBalances = stealthAccountsWithTokenBalances
    .filter(
      stealthAccount =>
        stealthAccount.tokenId === outputTokenId &&
        stealthAccount.balance !== '0'
    )
    .filter(stealthAccount => stealthAccount.chainId === outputChainId);

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
        nonce: destinationChainStealthAccount.nonce,
      });
      remainingAmount = BigInt(0);
      break;
    } else {
      sendFromAccounts.push({
        stealthAccount: destinationChainStealthAccount.stealthAddress,
        chainId: destinationChainStealthAccount.chainId,
        amount: balance,
        nonce: destinationChainStealthAccount.nonce,
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
        nonce: otherChainStealthAccount.nonce,
      });
      remainingAmount = BigInt(0);
      break;
    } else {
      sendFromAccounts.push({
        stealthAccount: otherChainStealthAccount.stealthAddress,
        chainId: otherChainStealthAccount.chainId,
        amount: balance,
        nonce: otherChainStealthAccount.nonce,
      });
    }

    remainingAmount -= balance;
  }

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
  nonce,
  gasInfo,
  tag,
}: {
  stealthSigner: Hex;
  to: Hex;
  tokenAddress: Hex;
  amount: bigint;
  chainId: number;
  nonce: number | null;
  gasInfo: ChainGasInfo[];
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
    nonce,
    tag,
    gasInfo,
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
  nonce,
  gasInfo,
  tag,
}: {
  stealthSigner: Hex;
  to: Hex;
  amount: bigint;
  chainId: number;
  gasInfo: ChainGasInfo[];
  nonce: number | null;
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
    nonce,
    data: '0x',
    tag,
    gasInfo,
  });

  return userOp;
};

const buildTransferUseOp = async ({
  stealthSigner,
  to,
  tokenAddress,
  amount,
  chainId,
  nonce,
  gasInfo,
  tag,
}: {
  stealthSigner: Hex;
  to: Hex;
  tokenAddress: Hex;
  amount: bigint;
  chainId: number;
  nonce: number | null;
  gasInfo: ChainGasInfo[];
  tag: Hex;
}) => {
  if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
    return buildETHTransferUserOp({
      stealthSigner,
      to,
      amount,
      chainId,
      nonce,
      gasInfo,
      tag,
    });
  }

  return buildERC20TransferUserOp({
    stealthSigner,
    to,
    tokenAddress,
    amount,
    chainId,
    nonce,
    gasInfo,
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
  gasInfo,
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
  gasInfo: ChainGasInfo[];
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

  const sendTo = inputs.length > 1 ? consolidateToStealthAccount.address : to;

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

      if (!tokenAddress) {
        throw new Error('Token address not found');
      }

      const stealthSigner = input.stealthAccount.signerAddress;

      // Build a standard transfer user operation
      const userOp = await buildTransferUseOp({
        stealthSigner,
        to: sendTo,
        tokenAddress,
        amount: input.amount,
        chainId: input.chainId,
        nonce: input.nonce,
        tag,
        gasInfo,
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
        recipient: sendTo,
        originChainId: input.chainId,
        destinationChainId: outputChainId,
        amount: input.amount.toString(),
        originCurrency: inputTokenAddress,
        destinationCurrency: tokenAddressOnOutputChain,
        tradeType: 'EXACT_OUTPUT',
      });

      relayQuotes.push(quote);

      const userOps = await buildUserOpsFromRelayQuote({
        stealthSigner: input.stealthAccount.signerAddress,
        quote,
        signerNonce: input.nonce,
        tag,
        gasInfo,
      });

      unsignedBridgeUserOps.push(...userOps);
    }
  }

  let finalTransferUserOp;
  if (inputs.length > 1) {
    const consolidateAccountStealthSigner =
      consolidateToStealthAccount.signerAddress;

    finalTransferUserOp = await buildTransferUseOp({
      stealthSigner: consolidateAccountStealthSigner,
      tokenAddress: tokenAddressOnOutputChain,
      to,
      amount,
      chainId: outputChainId,
      nonce: null,
      gasInfo,
      tag,
    });
  }

  return {
    aggregationUserOps: unsignedBridgeUserOps,
    finalTransferUserOp,
    consolidateToStealthAccount:
      inputs.length > 1 ? consolidateToStealthAccount : undefined,
    relayQuotes,
  };
};
