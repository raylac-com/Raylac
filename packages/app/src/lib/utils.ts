import * as SecureStore from 'expo-secure-store';
import { Hex } from 'viem';
import * as Clipboard from 'expo-clipboard';

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
