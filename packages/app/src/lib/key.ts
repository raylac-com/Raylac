import * as SecureStore from 'expo-secure-store';

const MNEMONIC_STORAGE_KEY = 'mnemonic';
const SPENDING_PRIV_KEY_STORAGE_KEY = 'spendingPrivKey';
const VIEWING_PRIV_KEY_STORAGE_KEY = 'viewingPrivKey';

const REQUIRE_AUTHENTICATION = process.env.NODE_ENV !== 'development';

/**
 * Returns true if the key exists in the secure store
 */
const keyExists = async (key: string): Promise<boolean> => {
  const item = await SecureStore.getItemAsync(key);
  return !!item;
};

export const saveMnemonic = async (mnemonic: string) => {
  if (await keyExists(MNEMONIC_STORAGE_KEY)) {
    // TODO: Send warning to Sentry
  } else {
    await SecureStore.setItemAsync(MNEMONIC_STORAGE_KEY, mnemonic, {
      requireAuthentication: REQUIRE_AUTHENTICATION,
    });
  }
};

export const saveSpendingPrivKey = async (privKey: string) => {
  if (await keyExists(SPENDING_PRIV_KEY_STORAGE_KEY)) {
    // TODO: Send warning to Sentry
    await SecureStore.setItemAsync(SPENDING_PRIV_KEY_STORAGE_KEY, privKey, {
      requireAuthentication: REQUIRE_AUTHENTICATION,
    });
  } else {
    await SecureStore.setItemAsync(SPENDING_PRIV_KEY_STORAGE_KEY, privKey, {
      requireAuthentication: REQUIRE_AUTHENTICATION,
    });
  }
};

export const saveViewingPrivKey = async (privKey: string) => {
  if (await keyExists(VIEWING_PRIV_KEY_STORAGE_KEY)) {
    // TODO: Send warning to Sentry
    await SecureStore.setItemAsync(VIEWING_PRIV_KEY_STORAGE_KEY, privKey, {
      requireAuthentication: REQUIRE_AUTHENTICATION,
    });
  } else {
    await SecureStore.setItemAsync(VIEWING_PRIV_KEY_STORAGE_KEY, privKey, {
      requireAuthentication: REQUIRE_AUTHENTICATION,
    });
  }
};

export const getMnemonic = async () => {
  return await SecureStore.getItemAsync(MNEMONIC_STORAGE_KEY);
};

export const getSpendingPrivKey = async () => {
  return await SecureStore.getItemAsync(SPENDING_PRIV_KEY_STORAGE_KEY);
};

export const getViewingPrivKey = async () => {
  return await SecureStore.getItemAsync(VIEWING_PRIV_KEY_STORAGE_KEY);
};
