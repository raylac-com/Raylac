import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hex } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import * as Clipboard from 'expo-clipboard';

export const ACCOUNT_SPENDING_PUB_KEY_STORAGE_KEY = 'account_spending_pub_key';
export const ACCOUNT_VIEWING_PUB_KEY_STORAGE_KEY = 'account_viewing_pub_key';
export const ACCOUNT_SPENDING_PRIV_KEY_STORAGE_KEY = 'account_priv_key';
export const ACCOUNT_VIEWING_PRIV_KEY_STORAGE_KEY = 'account_viewing_priv_key';

export const getChain = () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_CHAIN === 'sepolia'
  ) {
    return baseSepolia;
  }

  return base;
};

export const shortenAddress = (address: Hex) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const SIGNED_IN_USER_STORAGE_KEY = 'signedInUser';

export const saveSignedInUser = async (userId: number) => {
  if (await AsyncStorage.getItem(SIGNED_IN_USER_STORAGE_KEY)) {
    throw new Error('User already signed in');
  }

  await AsyncStorage.setItem(SIGNED_IN_USER_STORAGE_KEY, userId.toString());
};

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
