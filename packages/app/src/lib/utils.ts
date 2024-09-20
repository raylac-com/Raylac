import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hex } from 'viem';
import * as Clipboard from 'expo-clipboard';
import { ACCOUNT_INDEX_STORAGE_KEY_PREFIX } from './account';
import { ServerId } from '@/types';

export const ACCOUNT_SPENDING_PUB_KEY_STORAGE_KEY = 'account_spending_pub_key';
export const ACCOUNT_VIEWING_PUB_KEY_STORAGE_KEY = 'account_viewing_pub_key';
export const ACCOUNT_SPENDING_PRIV_KEY_STORAGE_KEY = 'account_priv_key';
export const ACCOUNT_VIEWING_PRIV_KEY_STORAGE_KEY = 'account_viewing_priv_key';

export const shortenAddress = (address: Hex) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const SIGNED_IN_USER_STORAGE_KEY = 'signedInUser';

export const getServerId = (): ServerId => {
  switch (process.env.EXPO_PUBLIC_RPC_URL) {
    case 'https://dantehrani.ngrok.app':
      return ServerId.Local;
    case 'https://raylac-api.onrender.com':
      return ServerId.Production;
    default:
      throw new Error('Unknown server');
  }
};

/**
 * Save the local account index for the given user
 */
export const saveAccountIndex = async ({
  userId,
  accountIndex,
}: {
  userId: number;
  accountIndex: number;
}) => {
  await AsyncStorage.setItem(
    `${ACCOUNT_INDEX_STORAGE_KEY_PREFIX}_${userId}`,
    accountIndex.toString()
  );
};

/**
 * Get the local account index for the given user
 */
export const getAccountIndexFromUserId = (userId: number) => {
  return AsyncStorage.getItem(`${ACCOUNT_INDEX_STORAGE_KEY_PREFIX}_${userId}`);
};

export const setSignedInUser = async (userId: number) => {
  if (await AsyncStorage.getItem(SIGNED_IN_USER_STORAGE_KEY)) {
    throw new Error('User already signed in');
  }

  await AsyncStorage.setItem(SIGNED_IN_USER_STORAGE_KEY, userId.toString());
};

/**
 * Get the signed in userId saved in AsyncStorage
 */
export const getSignedInUserId = async (): Promise<number | null> => {
  const userId = await AsyncStorage.getItem(SIGNED_IN_USER_STORAGE_KEY);
  return userId ? parseInt(userId) : null;
};

export const deleteSignedInUser = async () => {
  await AsyncStorage.removeItem(SIGNED_IN_USER_STORAGE_KEY);
};

export const copyToClipboard = async (text: string) => {
  await Clipboard.setStringAsync(text);
};

export const getClipboardText = async () => {
  const text = await Clipboard.getStringAsync();
  return text;
};
