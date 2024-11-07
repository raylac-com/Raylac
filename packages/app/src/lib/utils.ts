import * as SecureStore from 'expo-secure-store';
import { Hex } from 'viem';
import * as Clipboard from 'expo-clipboard';
import { AddressOrUser, TransferItem } from '@/types';
import { publicKeyToAddress } from 'viem/accounts';
import {
  formatAmount,
  encodePaymasterAndData,
  getTokenMetadata,
  UserOperation,
  RAYLAC_PAYMASTER_V2_ADDRESS,
} from '@raylac/shared';
import { getRpcClient } from './trpc';

export const ACCOUNT_SPENDING_PUB_KEY_STORAGE_KEY = 'account_spending_pub_key';
export const ACCOUNT_VIEWING_PUB_KEY_STORAGE_KEY = 'account_viewing_pub_key';
export const ACCOUNT_SPENDING_PRIV_KEY_STORAGE_KEY = 'account_priv_key';
export const ACCOUNT_VIEWING_PRIV_KEY_STORAGE_KEY = 'account_viewing_priv_key';

export const shortenAddress = (address: Hex) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const SIGNED_IN_USER_STORAGE_KEY = 'signedInUser';

export const setSignedInUser = async (userId: number) => {
  await SecureStore.setItemAsync(SIGNED_IN_USER_STORAGE_KEY, userId.toString());
};

/**
 * Get the signed in userId saved in SecureStorage.
 */
export const getSignedInUserId = async (): Promise<number | null> => {
  const userId = await SecureStore.getItemAsync(SIGNED_IN_USER_STORAGE_KEY);
  return userId ? parseInt(userId) : null;
};

export const deleteSignedInUser = async () => {
  await SecureStore.deleteItemAsync(SIGNED_IN_USER_STORAGE_KEY);
};

export const copyToClipboard = async (text: string) => {
  await Clipboard.setStringAsync(text);
};

export const getClipboardText = async () => {
  const text = await Clipboard.getStringAsync();
  return text;
};

export const getFinalTransfer = (transfer: TransferItem) => {
  const senders = new Set<string>();

  transfer.traces.forEach(trace => {
    senders.add(trace.from);
  });

  const finalTransfer = transfer.traces.find(trace => !senders.has(trace.to));

  if (!finalTransfer) {
    throw new Error('No final transfer found');
  }

  return finalTransfer;
};

export const getTransferType = (
  transfer: TransferItem,
  signedInUserId: number
): 'incoming' | 'outgoing' => {
  const finalTransfer = getFinalTransfer(transfer);

  return finalTransfer.UserStealthAddressFrom?.userId === signedInUserId
    ? 'outgoing'
    : 'incoming';
};

export const isAddress = (
  addressOrUser: AddressOrUser
): addressOrUser is string => {
  return typeof addressOrUser === 'string';
};

export const getAvatarAddress = (addressOrUser: AddressOrUser) => {
  return isAddress(addressOrUser)
    ? addressOrUser
    : publicKeyToAddress(addressOrUser.spendingPubKey as Hex);
};

export const getProfileImage = (addressOrUser: AddressOrUser) => {
  return isAddress(addressOrUser) ? undefined : addressOrUser.profileImage;
};

export const getDisplayName = (addressOrUser: AddressOrUser) => {
  return isAddress(addressOrUser)
    ? shortenAddress(addressOrUser as Hex)
    : addressOrUser.name;
};

/**
 * Get the USD amount of a transfer.
 *
 * If the transfer has a token price at op, use that.
 * Otherwise, if the transfer has a token price at trace, use that.
 * Otherwise, return null.
 */
export const getUsdTransferAmount = (transfer: TransferItem): string | null => {
  const finalTransfer = getFinalTransfer(transfer);

  const amount = finalTransfer.amount as string;

  const tokenMeta = getTokenMetadata(finalTransfer.tokenId);
  const formattedAmount = Number(formatAmount(amount, tokenMeta.decimals));

  const userOps = transfer.userOps;
  const tokenPriceAtOp = userOps?.length > 0 ? userOps[0].tokenPriceAtOp : null;

  if (tokenPriceAtOp) {
    // Prioritize token price at op
    return (tokenPriceAtOp * formattedAmount).toFixed(2);
  }

  const tokenPriceAtTrace = finalTransfer.tokenPriceAtTrace;

  if (tokenPriceAtTrace) {
    return (tokenPriceAtTrace * formattedAmount).toFixed(2);
  }

  return null;
};

export const getPaymasterAndData = async (userOp: UserOperation) => {
  const client = getRpcClient();
  const paymasterSig = await client.paymasterSignUserOp.mutate({
    userOp,
  });

  const paymasterAndData = encodePaymasterAndData({
    paymaster: RAYLAC_PAYMASTER_V2_ADDRESS,
    data: paymasterSig,
  });

  return paymasterAndData;
};
