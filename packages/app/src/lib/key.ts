import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { hdKeyToAccount } from 'viem/accounts';
import { HDKey } from 'viem/accounts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bip39 from 'bip39';
import { Buffer } from 'buffer';
import { Hex } from 'viem/_types/types/misc';
import { UserAddress } from '@/types';

globalThis.Buffer = Buffer;

const USER_ADDRESSES_STORAGE_KEY = 'raylac-userAddresses';

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
 * Build a storage key for the backup verification status of an address.
 */
export const buildBackupVerificationStatusStorageKey = (address: Hex) => {
  return `${address}-backup-verification-status`;
};

export const isBackupVerificationComplete = async (
  address: Hex
): Promise<boolean> => {
  const item = await AsyncStorage.getItem(
    buildBackupVerificationStatusStorageKey(address)
  );

  return item === 'true';
};

export const setBackupVerificationStatus = async ({
  address,
  status,
}: {
  address: Hex;
  status: 'complete' | 'incomplete';
}) => {
  await AsyncStorage.setItem(
    buildBackupVerificationStatusStorageKey(address),
    status === 'complete' ? 'true' : 'false'
  );
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
  // TODO: Check that the address is checksummed

  const addressesRaw = await AsyncStorage.getItem(USER_ADDRESSES_STORAGE_KEY);

  const addresses = addressesRaw
    ? (JSON.parse(addressesRaw) as UserAddress[])
    : [];

  if (addresses.some(a => a.address === userAddress.address)) {
    return;
  }

  addresses.push(userAddress);

  await AsyncStorage.setItem(
    USER_ADDRESSES_STORAGE_KEY,
    JSON.stringify(addresses)
  );
};

export const getUserAddresses = async (): Promise<UserAddress[]> => {
  const addresses = await AsyncStorage.getItem(USER_ADDRESSES_STORAGE_KEY);

  return addresses ? JSON.parse(addresses) : [];
};

export const savePrivateKey = async ({
  address,
  privKey,
}: {
  address: Hex;
  privKey: Hex;
}) => {
  await SecureStore.setItem(buildPrivateKeyStorageKey(address), privKey, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
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

export const saveMnemonic = async ({
  address,
  mnemonic,
}: {
  address: Hex;
  mnemonic: string;
}) => {
  await SecureStore.setItem(buildMnemonicStorageKey(address), mnemonic, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};

export const getMnemonic = async (address: Hex): Promise<string | null> => {
  const item = await SecureStore.getItem(buildMnemonicStorageKey(address), {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });

  return item as string | null;
};
