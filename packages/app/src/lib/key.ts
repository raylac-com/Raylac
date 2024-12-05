import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { HDAccount, hdKeyToAccount } from 'viem/accounts';
import { mnemonicToAccount } from 'viem/accounts';

const MNEMONIC_STORAGE_KEY = 'mnemonic';
const BACKUP_VERIFICATION_COMPLETE_STORAGE_KEY = 'backupVerificationComplete';

const REQUIRE_AUTHENTICATION =
  Constants.appOwnership !== 'expo' && Device.isDevice;

export const getSignerAccount = async (): Promise<HDAccount> => {
  const mnemonic =
    'rain profit typical section elephant expire curious defy basic despair toy scene';

  const account = mnemonicToAccount(mnemonic);

  const hdKey = account.getHdKey();

  const hdAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  return hdAccount;
};

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
