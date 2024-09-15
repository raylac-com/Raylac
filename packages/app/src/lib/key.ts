import * as SecureStore from 'expo-secure-store';

const MNEMONIC_STORAGE_KEY = 'mnemonic';

const REQUIRE_AUTHENTICATION = process.env.NODE_ENV !== 'development';

/**
 * Save a mnemonic to secure storage.
 * Throws if a different mnemonic is already saved.
 */
export const saveMnemonic = async (mnemonic: string) => {
  const existingMnemonic = await getMnemonic();
  if (existingMnemonic !== null && existingMnemonic !== mnemonic) {
    throw new Error('Trying to overwrite existing mnemonic');
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
  await SecureStore.deleteItemAsync(MNEMONIC_STORAGE_KEY);
};
