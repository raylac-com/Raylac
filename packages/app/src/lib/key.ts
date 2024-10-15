import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { getSpendingPrivKey, getViewingPrivKey } from '@raylac/shared';
import { MnemonicAndKeys } from '@/types';

const MNEMONIC_STORAGE_KEY = 'mnemonic';
const BACKUP_VERIFICATION_COMPLETE_STORAGE_KEY = 'backupVerificationComplete';

const REQUIRE_AUTHENTICATION = Constants.appOwnership !== 'expo';

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
 * Save a mnemonic to secure storage for the given userId.
 * Throws if a different mnemonic is already saved for the userId.
 */
export const saveMnemonicAndKeys = async (mnemonic: string) => {
  const spendingPrivKey = getSpendingPrivKey(mnemonic);
  const viewingPrivKey = getViewingPrivKey(mnemonic);

  const mnemonicAndKeys: MnemonicAndKeys = {
    mnemonic,
    spendingPrivKey,
    viewingPrivKey,
  };

  await SecureStore.setItemAsync(
    MNEMONIC_STORAGE_KEY,
    JSON.stringify(mnemonicAndKeys),
    {
      requireAuthentication: REQUIRE_AUTHENTICATION,
    }
  );
};

/**
 * Get the mnemonic from secure storage.
 */
export const getMnemonicAndKeys = async (): Promise<MnemonicAndKeys> => {
  const mnemonic = await SecureStore.getItemAsync(MNEMONIC_STORAGE_KEY, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });

  if (mnemonic.includes('mnemonic')) {
    return JSON.parse(mnemonic);
  }

  const spendingPrivKey = getSpendingPrivKey(mnemonic);
  const viewingPrivKey = getViewingPrivKey(mnemonic);

  const mnemonicAndKeys: MnemonicAndKeys = {
    mnemonic,
    spendingPrivKey,
    viewingPrivKey,
  };

  await SecureStore.setItemAsync(
    MNEMONIC_STORAGE_KEY,
    JSON.stringify(mnemonicAndKeys),
    {
      requireAuthentication: REQUIRE_AUTHENTICATION,
    }
  );

  return mnemonicAndKeys;
};

/**
 * Delete the mnemonic from secure storage.
 */
export const deleteMnemonic = async () => {
  await SecureStore.deleteItemAsync(MNEMONIC_STORAGE_KEY, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};
