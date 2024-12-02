import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const MNEMONIC_STORAGE_KEY = 'mnemonic';
const BACKUP_VERIFICATION_COMPLETE_STORAGE_KEY = 'backupVerificationComplete';

const REQUIRE_AUTHENTICATION =
  Constants.appOwnership !== 'expo' && Device.isDevice;

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
 * Delete the mnemonic from secure storage.
 */
export const deleteMnemonic = async () => {
  await SecureStore.deleteItemAsync(MNEMONIC_STORAGE_KEY, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};
