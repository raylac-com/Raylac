import * as bip39 from 'bip39';
import { HDKey, hdKeyToAccount } from 'viem/accounts';
import { saveMnemonic } from '@/lib/key';
import { hdKeyToPrivateKey } from '@raylac/shared';

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

  await saveMnemonic(mnemonic);

  return {
    spendingAccount,
    viewingPrivKey,
  };
};
