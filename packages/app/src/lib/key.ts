import * as SecureStore from 'expo-secure-store';
import { getServerId } from './utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServerId } from '@/types';
import Constants from 'expo-constants';

const SIGN_IN_AVAILABLE_USER_IDS_STORAGE_KEY = 'userIds';
const MNEMONIC_STORAGE_KEY_PREFIX = 'mnemonic';
const BACKUP_VERIFICATION_COMPLETE_STORAGE_KEY = 'backupVerificationComplete';

const REQUIRE_AUTHENTICATION = Constants.appOwnership !== 'expo';

export const isBackupVerificationComplete = async (): Promise<boolean> => {
  return (
    (await AsyncStorage.getItem(BACKUP_VERIFICATION_COMPLETE_STORAGE_KEY)) ===
    'true'
  );
};

export const setBackupVerificationComplete = async () => {
  await AsyncStorage.setItem(BACKUP_VERIFICATION_COMPLETE_STORAGE_KEY, 'true');
};

export const getSignInAvailableUserIds = async () => {
  const ids = await AsyncStorage.getItem(
    SIGN_IN_AVAILABLE_USER_IDS_STORAGE_KEY
  );

  // Only return the user IDs that are on the currently connected server
  const serverId = getServerId();

  const userIds = ids
    ? (JSON.parse(ids) as string[])
        .filter(id => id.startsWith(`${serverId}_`))
        .map(userId => Number(userId.split('_')[1]))
    : [];

  return userIds;
};

export const deleteSignInAvailableUserId = async ({
  userId,
  serverId,
}: {
  userId: number;
  serverId: ServerId;
}) => {
  const userIdKey = `${serverId}_${userId}`;

  const idsRaw = await AsyncStorage.getItem(
    SIGN_IN_AVAILABLE_USER_IDS_STORAGE_KEY
  );

  const ids = idsRaw ? JSON.parse(idsRaw) : [];

  const newIds = ids.filter(id => id !== userIdKey);

  await AsyncStorage.setItem(
    SIGN_IN_AVAILABLE_USER_IDS_STORAGE_KEY,
    JSON.stringify(newIds)
  );
};

const addSignInAvailableUserId = async ({
  userId,
  serverId,
}: {
  userId: number;
  serverId: ServerId;
}) => {
  const userIdKey = `${serverId}_${userId}`;

  const idsRaw = await AsyncStorage.getItem(
    SIGN_IN_AVAILABLE_USER_IDS_STORAGE_KEY
  );

  const ids = idsRaw ? JSON.parse(idsRaw) : [];

  if (!ids.includes(userIdKey)) {
    ids.push(userIdKey);

    await AsyncStorage.setItem(
      SIGN_IN_AVAILABLE_USER_IDS_STORAGE_KEY,
      JSON.stringify(ids)
    );
  }
};

/**
 * Get the key to store the mnemonic in secure storage.
 * The key is a combination of the user ID and the server ID.
 * The server ID is necessary since user IDs are auto-incremented numbers and not unique across servers.
 */
const getMnemonicKey = ({ userId, serverId }) => {
  return `${MNEMONIC_STORAGE_KEY_PREFIX}_${userId}_${serverId}`;
};

/**
 * Save a mnemonic to secure storage for the given userId.
 * Throws if a different mnemonic is already saved for the userId.
 */
export const saveMnemonic = async (mnemonic: string, userId: number) => {
  const existingMnemonic = await getMnemonic(userId);

  if (existingMnemonic !== null && existingMnemonic !== mnemonic) {
    throw new Error('Trying to overwrite existing mnemonic');
  }

  const key = getMnemonicKey({ userId, serverId: getServerId() });

  await addSignInAvailableUserId({
    userId,
    serverId: getServerId(),
  });

  await SecureStore.setItemAsync(key, mnemonic, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};

/**
 * Get the mnemonic from secure storage.
 */
export const getMnemonic = async (userId: number) => {
  const key = getMnemonicKey({ userId, serverId: getServerId() });

  return await SecureStore.getItemAsync(key, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};
