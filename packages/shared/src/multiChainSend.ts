import { encodeFunctionData, Hex, toHex } from 'viem';
import {
  ChainGasInfo,
  StealthAddressWithEphemeral,
  AddressTokenBalance,
  UserOperation,
} from './types';
import { buildUserOp } from './erc4337';
import { getPublicClient } from './ethRpc';
import { getTokenAddressOnChain } from './utils';
import ERC20Abi from './abi/ERC20Abi';
import { NATIVE_TOKEN_ADDRESS } from '.';

interface InputAddress {
  address: Hex;
  chainId: number;
  amount: bigint;
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
const chooseInputAddresses = ({
  tokenId,
  chainId,
  amount,
  addressTokenBalances,
}: {
  tokenId: string;
  chainId: number;
  amount: bigint;
  addressTokenBalances: AddressTokenBalance[];
}): InputAddress[] => {
  // Filter out stealth accounts with non-zero balance of the output token
  const sortedAddressTokenBalances = addressTokenBalances
    .filter(
      addressTokenBalance =>
        addressTokenBalance.tokenId === tokenId &&
        addressTokenBalance.balance !== '0' &&
        addressTokenBalance.chainId === chainId
    )
    // Sort by balance in descending order
    .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

  // Array of stealth accounts that will be used as inputs
  const sendFromAccounts: InputAddress[] = [];

  // Set the remaining amount that needs to be sent.
  // This is subtracted as we find stealth accounts with enough funds.
  let remainingAmount = amount;

  for (const addressTokenBalance of sortedAddressTokenBalances) {
    const balance = BigInt(addressTokenBalance.balance);

    if (balance >= remainingAmount) {
      // The account has more than enough funds to cover the remaining amount
      sendFromAccounts.push({
        address: addressTokenBalance.address,
        chainId: addressTokenBalance.chainId,
        amount: remainingAmount,
      });
      remainingAmount = BigInt(0);
      break;
    } else {
      sendFromAccounts.push({
        address: addressTokenBalance.address,
        chainId: addressTokenBalance.chainId,
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
 * Builds all the user operations required to send a token from user's stealth accounts.
 * The returned user operations are unsigned.
 */
export const buildMultiChainSendRequestBody = ({
  chainId,
  tokenId,
  to,
  amount,
  addressTokenBalances,
  stealthAddresses,
  addressNonces,
  gasInfo,
}: {
  tokenId: string;
  chainId: number;
  to: Hex;
  amount: bigint;
  addressTokenBalances: AddressTokenBalance[];
  stealthAddresses: StealthAddressWithEphemeral[];
  addressNonces: Record<Hex, number | null>;
  gasInfo: ChainGasInfo[];
}): UserOperation[] => {
  const inputs = chooseInputAddresses({
    chainId,
    tokenId,
    amount,
    addressTokenBalances,
  });

  // Sanity check
  if (!inputs.every(input => input.chainId === chainId)) {
    throw new Error('Not all input stealth accounts are on the output chain');
  }

  const tokenAddress = getTokenAddressOnChain({
    chainId: chainId,
    tokenId,
  });

  // Create a Uint8Array with 20 bytes
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  const tag = toHex(randomBytes);

  const consolidateTo = inputs[0];

  const userOps: UserOperation[] = [];

  for (const input of inputs) {
    if (consolidateTo.address === input.address) {
      continue;
    }

    // Get the stealth signer address that corresponds to the input address
    const stealthSigner = stealthAddresses.find(
      stealthAddress => stealthAddress.address === input.address
    )?.signerAddress;

    if (!stealthSigner) {
      throw new Error(`Stealth address not found for ${input.address}`);
    }

    const nonce = addressNonces[input.address];

    // Build a standard transfer user operation
    const userOp = buildTransferUseOp({
      stealthSigner,
      to: consolidateTo.address,
      tokenAddress,
      amount: input.amount,
      chainId: input.chainId,
      nonce,
      tag,
      gasInfo,
    });

    userOps.push({
      ...userOp,
      chainId: input.chainId,
    });
  }

  const consolidateToStealthSigner = stealthAddresses.find(
    stealthAddress => stealthAddress.address === consolidateTo.address
  )?.signerAddress;

  if (!consolidateToStealthSigner) {
    throw new Error(`Stealth address not found for ${consolidateTo.address}`);
  }

  // Send to the recipient from the consolidated account
  const userOp = buildTransferUseOp({
    stealthSigner: consolidateToStealthSigner,
    to,
    tokenAddress,
    amount,
    chainId: chainId,
    nonce: addressNonces[consolidateTo.address],
    tag,
    gasInfo,
  });

  userOps.push({
    ...userOp,
    chainId: chainId,
  });

  return userOps;
};
