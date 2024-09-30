import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

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
export const saveMnemonic = async (mnemonic: string) => {
  const existingMnemonic = await getMnemonic();

  if (existingMnemonic !== null && existingMnemonic !== mnemonic) {
    // throw new Error('Trying to overwrite existing mnemonic');
  }

  await SecureStore.setItemAsync(MNEMONIC_STORAGE_KEY, mnemonic, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};

/**
 * Get the mnemonic from secure storage.
 */
export const getMnemonic = async () => {
  return await SecureStore.getItemAsync(MNEMONIC_STORAGE_KEY, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};

/**
 * Delete the mnemonic from secure storage.
 */
export const deleteMnemonic = async () => {
  await SecureStore.deleteItemAsync(MNEMONIC_STORAGE_KEY, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};
