import { encodeFunctionData, Hex, toHex } from 'viem';
import {
  ChainGasInfo,
  StealthAddressWithEphemeral,
  TokenBalance,
  UserOperation,
} from './types';
import { buildUserOp } from './erc4337';
import { getPublicClient } from './ethRpc';
import { getTokenAddressOnChain } from './utils';
import ERC20Abi from './abi/ERC20Abi';
import { NATIVE_TOKEN_ADDRESS } from '.';

interface InputStealthAccount {
  stealthAccount: StealthAddressWithEphemeral;
  chainId: number;
  amount: bigint;
  nonce: number | null;
}

/**
 * Turn all steps in a Relay quote into executable user operations
 */
/*
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
*/

/**
 * Pick the stealth accounts to use as inputs for a transfer.
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
  const stealthAccounts = stealthAccountsWithTokenBalances
    .filter(
      stealthAccount =>
        stealthAccount.tokenId === outputTokenId &&
        stealthAccount.balance !== '0' &&
        stealthAccount.chainId === outputChainId
    )
    // Sort by balance in descending order
    .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

  // Array of stealth accounts that will be used as inputs
  const sendFromAccounts: InputStealthAccount[] = [];

  // Set the remaining amount that needs to be sent.
  // This is subtracted as we find stealth accounts with enough funds.
  let remainingAmount = amount;

  for (const stealthAccount of stealthAccounts) {
    const balance = BigInt(stealthAccount.balance);

    if (balance >= remainingAmount) {
      // The account has more than enough funds to cover the remaining amount
      sendFromAccounts.push({
        stealthAccount: stealthAccount.stealthAddress,
        chainId: stealthAccount.chainId,
        amount: remainingAmount,
        nonce: stealthAccount.nonce,
      });
      remainingAmount = BigInt(0);
      break;
    } else {
      sendFromAccounts.push({
        stealthAccount: stealthAccount.stealthAddress,
        chainId: stealthAccount.chainId,
        amount: balance,
        nonce: stealthAccount.nonce,
      });
    }

    remainingAmount -= balance;
  }

  if (remainingAmount === BigInt(0)) {
    // There are enough funds on the destination chain.
    // The user can send from accounts from/to the specified destination chain.
    return sendFromAccounts;
  }

  if (remainingAmount !== BigInt(0)) {
    throw new Error('Not enough funds');
  }

  return sendFromAccounts;
};

/**
 * Build a `UserOperation` for an ERC20 transfer
 */
export const buildERC20TransferUserOp = ({
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

  const userOp = buildUserOp({
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
export const buildETHTransferUserOp = ({
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

  const userOp = buildUserOp({
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

const buildTransferUseOp = ({
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
export const buildMultiChainSendRequestBody = ({
  outputChainId,
  tokenId,
  to,
  amount,
  stealthAccountsWithTokenBalances,
  gasInfo,
}: {
  tokenId: string;
  outputChainId: number;
  to: Hex;
  amount: bigint;
  stealthAccountsWithTokenBalances: TokenBalance[];
  gasInfo: ChainGasInfo[];
}): UserOperation[] => {
  const inputs = chooseInputStealthAccounts({
    outputChainId,
    outputTokenId: tokenId,
    amount,
    stealthAccountsWithTokenBalances,
  });

  // Sanity check
  if (!inputs.every(input => input.chainId === outputChainId)) {
    throw new Error('Not all input stealth accounts are on the output chain');
  }

  const tokenAddress = getTokenAddressOnChain({
    chainId: outputChainId,
    tokenId,
  });

  // Create a Uint8Array with 20 bytes
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  const tag = toHex(randomBytes);

  const consolidateTo = inputs[0];

  const userOps: UserOperation[] = [];

  for (const input of inputs) {
    if (consolidateTo.stealthAccount.address === input.stealthAccount.address) {
      continue;
    }

    const stealthSigner = input.stealthAccount.signerAddress;

    // Build a standard transfer user operation
    const userOp = buildTransferUseOp({
      stealthSigner,
      to: consolidateTo.stealthAccount.address,
      tokenAddress,
      amount: input.amount,
      chainId: input.chainId,
      nonce: input.nonce,
      tag,
      gasInfo,
    });

    userOps.push({
      ...userOp,
      chainId: input.chainId,
    });
  }

  // Send to the recipient from the consolidated account
  const userOp = buildTransferUseOp({
    stealthSigner: consolidateTo.stealthAccount.signerAddress,
    to,
    tokenAddress,
    amount,
    chainId: outputChainId,
    nonce: consolidateTo.nonce,
    tag,
    gasInfo,
  });

  userOps.push({
    ...userOp,
    chainId: outputChainId,
  });

  return userOps;
};
