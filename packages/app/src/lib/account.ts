import * as bip39 from 'bip39';
import { HDKey, hdKeyToAccount } from 'viem/accounts';
import { saveMnemonic } from '@/lib/key';
import { hdKeyToPrivateKey } from '@raylac/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCOUNT_INDEX_STORAGE_KEY_PREFIX = 'accountIndex';

export const getNumSavedAccounts = async () => {
  const keys = await AsyncStorage.getAllKeys();
  return keys.filter(key => key.startsWith(ACCOUNT_INDEX_STORAGE_KEY_PREFIX))
    .length;
};

export const initAccountFromMnemonic = async (mnemonic: string) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const hdKey = HDKey.fromMasterSeed(seed);

  const spendingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  const viewingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 1,
  });

  const viewingPrivKey = hdKeyToPrivateKey(viewingAccount.getHdKey());

  const nextAccountIndex = await getNumSavedAccounts();
  await saveMnemonic(mnemonic, nextAccountIndex);

  return {
    spendingAccount,
    viewingPrivKey,
  };
};
