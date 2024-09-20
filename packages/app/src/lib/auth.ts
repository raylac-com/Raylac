import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_STORAGE_KEY = 'authToken';

export const saveAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, token);
};

/**
 * Get the auth token saved in SecureStore
 */
export const getAuthToken = async () => {
  return await SecureStore.getItemAsync(AUTH_TOKEN_STORAGE_KEY);
};

export const deleteAuthToken = async () => {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY);
};
