import * as SecureStore from 'expo-secure-store';
import * as bip39 from 'bip39';
import { hdKeyToAccount, HDKey } from 'viem/accounts';
import { Hex } from 'viem';

const MNEMONIC_STORAGE_KEY = 'mnemonic';

const REQUIRE_AUTHENTICATION = process.env.NODE_ENV !== 'development';

export const saveMnemonic = async (mnemonic: string) => {
  await SecureStore.setItemAsync(MNEMONIC_STORAGE_KEY, mnemonic);
};

export const getMnemonic = async () => {
  return await SecureStore.getItemAsync(MNEMONIC_STORAGE_KEY, {
    requireAuthentication: REQUIRE_AUTHENTICATION,
  });
};

const hdKeyToPrivateKey = (hdKey: HDKey): Hex => {
  return `0x${Buffer.from(hdKey.privateKey).toString('hex')}`;
};

/**
 * Get the spending private key from a mnemonic
 */
export const getSpendingPrivKey = (mnemonic: string) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const hdKey = HDKey.fromMasterSeed(seed);

  const spendingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  return hdKeyToPrivateKey(spendingAccount.getHdKey());
};

/**
 * Get the viewing private key from a mnemonic
 */
export const getViewingPrivKey = (mnemonic: string) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);

  const viewingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 1,
  });

  return hdKeyToPrivateKey(viewingAccount.getHdKey());
};

export const deleteMnemonic = async () => {
  await SecureStore.deleteItemAsync(MNEMONIC_STORAGE_KEY);
};
