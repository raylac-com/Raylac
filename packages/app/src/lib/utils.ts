import * as SecureStore from 'expo-secure-store';
import { Hex } from 'viem';
import * as Clipboard from 'expo-clipboard';
import { AddressOrUser, TraceItem, TransferItem } from '@/types';
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

/**
 * Get the final transfers for each chain in a multi-chain transfer.
 */
export const getFinalTransfers = (transfer: TransferItem) => {
  const finalTransfers: TraceItem[] = [];

  const toUserId =
    transfer.transactions[0].traces[0].UserStealthAddressTo.userId;

  for (const transaction of transfer.transactions) {
    const finalTransfer = transaction.traces.find(
      trace => trace.UserStealthAddressTo.userId === toUserId
    );

    if (!finalTransfer) {
      throw new Error('No final transfer found');
    }

    finalTransfers.push(finalTransfer);
  }

  return finalTransfers;
};

export const getTransferType = (
  transfer: TransferItem,
  signedInUserId: number
): 'incoming' | 'outgoing' => {
  const finalTransfers = getFinalTransfers(transfer);

  return finalTransfers[0].UserStealthAddressFrom?.userId === signedInUserId
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

export const getNameIfUser = (addressOrUser: AddressOrUser) => {
  return isAddress(addressOrUser) ? null : addressOrUser.name;
};

export const getDisplayName = (addressOrUser: AddressOrUser) => {
  return isAddress(addressOrUser)
    ? shortenAddress(addressOrUser as Hex)
    : addressOrUser.name;
};

/**
 * Get the USD amount of a transfer.
 *
 * Use the token price logged to the trace record to determine the USD amount.
 */
export const getUsdTransferAmount = (
  transfer: TransferItem,
  tokenId: Hex
): string | null => {
  const tokenMeta = getTokenMetadata(tokenId);

  const amount = transfer.amount;

  const formattedAmount = Number(formatAmount(amount, tokenMeta.decimals));

  const tokenPriceAtTrace =
    transfer.transactions[0].traces[0].tokenPriceAtTrace;

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
