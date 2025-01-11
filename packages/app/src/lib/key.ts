import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { hdKeyToAccount } from 'viem/accounts';
import { HDKey } from 'viem/accounts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bip39 from 'bip39';
import { Buffer } from 'buffer';
import { Hex } from 'viem/_types/types/misc';
import { UserAddress } from '@/types';
import { getAddress } from 'viem';

globalThis.Buffer = Buffer;

const USER_ADDRESSES_STORAGE_KEY = 'userAddresses';
const REQUIRE_AUTHENTICATION = Device.isDevice;

/**
 * Build a storage key for the mnemonic of an address.
 */
const buildMnemonicStorageKey = (address: Hex) => {
  return `${address}-mnemonic`;
};

/**
 * Build a storage key for the private key of an address.
 */
const buildPrivateKeyStorageKey = (address: Hex) => {
  return `${address}-private-key`;
};

/**
 * Get the private key of an `HDKey` in hex format.
 */
const hdKeyToPrivateKey = (hdKey: HDKey): Hex => {
  return `0x${Buffer.from(hdKey.privateKey!).toString('hex')}`;
};

export const getAccountFromMnemonic = async ({
  mnemonic,
  accountIndex,
}: {
  mnemonic: string;
  accountIndex: number;
}) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const hdKey = HDKey.fromMasterSeed(seed);

  const account = hdKeyToAccount(hdKey, {
    accountIndex,
  });

  const privKey = hdKeyToPrivateKey(account.getHdKey());

  return { account, privKey };
};

export const saveUserAddress = async (userAddress: UserAddress) => {
  if (userAddress.address !== getAddress(userAddress.address)) {
    throw new Error(`Address must be checksummed: ${userAddress.address}`);
  }

  const addressesRaw = await AsyncStorage.getItem(USER_ADDRESSES_STORAGE_KEY);

  const addresses = addressesRaw
    ? (JSON.parse(addressesRaw) as UserAddress[])
    : [];

  // Overwrite the existing address if it already exists
  const newAddresses = addresses.filter(a => a.address !== userAddress.address);

  newAddresses.push(userAddress);

  await AsyncStorage.setItem(
    USER_ADDRESSES_STORAGE_KEY,
    JSON.stringify(newAddresses)
  );
};

export const setBackupVerified = async (address: Hex) => {
  if (address !== getAddress(address)) {
    throw new Error(`Address must be checksummed: ${address}`);
  }

  const addresses = await getUserAddresses();

  const newAddresses = addresses.map(a =>
    a.address === address ? { ...a, isBackupVerified: true } : a
  );

  await AsyncStorage.setItem(
    USER_ADDRESSES_STORAGE_KEY,
    JSON.stringify(newAddresses)
  );
};

export const getUserAddresses = async (): Promise<UserAddress[]> => {
  const addresses = await AsyncStorage.getItem(USER_ADDRESSES_STORAGE_KEY);

  return addresses ? JSON.parse(addresses) : [];
};

/**
 * Save the private key to SecureStore.
 */
export const savePrivateKey = async ({
  address,
  privKey,
}: {
  address: Hex;
  privKey: Hex;
}) => {
  await SecureStore.setItem(buildPrivateKeyStorageKey(address), privKey);
};

export const getPrivateKey = async (address: Hex): Promise<Hex | null> => {
  const item = await SecureStore.getItem(buildPrivateKeyStorageKey(address), {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });

  if (!item) {
    return null;
  }

  return item as Hex;
};

/**
 * Save the mnemonic to SecureStore.
 */
export const saveMnemonic = async ({
  address,
  mnemonic,
}: {
  address: Hex;
  mnemonic: string;
}) => {
  await SecureStore.setItem(buildMnemonicStorageKey(address), mnemonic);
};

/**
 * Get mnemonic for a genesis address from SecureStore.
 */
export const getMnemonic = async (address: Hex): Promise<string | null> => {
  const item = await SecureStore.getItem(buildMnemonicStorageKey(address), {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });

  return item as string | null;
};

/**
 * Remove an address from the user's addresses.
 */
export const removeAddress = async (address: Hex) => {
  const addresses = await getUserAddresses();

  const newAddresses = addresses.filter(a => a.address !== address);

  await AsyncStorage.setItem(
    USER_ADDRESSES_STORAGE_KEY,
    JSON.stringify(newAddresses)
  );
};
