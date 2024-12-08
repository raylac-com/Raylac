import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { hdKeyToAccount } from 'viem/accounts';
import { HDKey } from 'viem/accounts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bip39 from 'bip39';
import { Buffer } from 'buffer';
import { Hex } from 'viem/_types/types/misc';

globalThis.Buffer = Buffer;

const MNEMONIC_AND_PRIV_KEY_STORAGE_KEY = 'raylac-mnemonicAndPrivKey';
const BACKUP_VERIFICATION_COMPLETE_STORAGE_KEY =
  'raylac-backupVerificationComplete';
const USER_ADDRESS_STORAGE_KEY = 'userAddress';

const REQUIRE_AUTHENTICATION = Device.isDevice;

export const isBackupVerificationComplete = async (): Promise<boolean> => {
  return (
    (await SecureStore.getItem(BACKUP_VERIFICATION_COMPLETE_STORAGE_KEY)) ===
    'true'
  );
};

export const setBackupVerificationStatus = async (
  status: 'complete' | 'incomplete'
) => {
  await SecureStore.setItem(
    BACKUP_VERIFICATION_COMPLETE_STORAGE_KEY,
    status === 'complete' ? 'true' : 'false'
  );
};

/**
 * Get the private key of an `HDKey` in hex format.
 */
const hdKeyToPrivateKey = (hdKey: HDKey): Hex => {
  return `0x${Buffer.from(hdKey.privateKey!).toString('hex')}`;
};

export const getAccountFromMnemonic = async (mnemonic: string) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const hdKey = HDKey.fromMasterSeed(seed);

  const account = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  const privKey = hdKeyToPrivateKey(account.getHdKey());

  return { account, privKey };
};

/**
 * Save the mnemonic and private key to secure storage.
 */
export const saveMnemonicAndPrivKey = async ({
  mnemonic,
  privKey,
}: {
  mnemonic: string;
  privKey: Hex;
}) => {
  await SecureStore.setItem(
    MNEMONIC_AND_PRIV_KEY_STORAGE_KEY,
    JSON.stringify({ mnemonic, privKey }),
    {
      requireAuthentication: REQUIRE_AUTHENTICATION,
    }
  );
};

export const getMnemonicAndPrivKey = async (): Promise<{
  mnemonic: string;
  privKey: Hex;
} | null> => {
  const item = await SecureStore.getItem(MNEMONIC_AND_PRIV_KEY_STORAGE_KEY, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });

  return item ? JSON.parse(item) : null;
};

export const deleteMnemonicAndPrivKey = async () => {
  await SecureStore.deleteItemAsync(MNEMONIC_AND_PRIV_KEY_STORAGE_KEY, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};

export const getUserAddress = async () => {
  const singerAddress = await AsyncStorage.getItem(USER_ADDRESS_STORAGE_KEY);

  if (!singerAddress) {
    return null;
  }

  return singerAddress as Hex;
};

export const setUserAddress = async (address: Hex) => {
  await AsyncStorage.setItem(USER_ADDRESS_STORAGE_KEY, address);
};

export const deleteUserAddress = async () => {
  await AsyncStorage.removeItem(USER_ADDRESS_STORAGE_KEY);
};
