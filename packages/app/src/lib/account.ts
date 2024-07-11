import * as bip39 from 'bip39';
import { Hex } from 'viem';
import { HDKey, hdKeyToAccount } from 'viem/accounts';
import { saveMnemonic } from '@/lib/key';

const hdKeyToPrivateKey = (hdKey: HDKey): Hex => {
  return `0x${Buffer.from(hdKey.privateKey).toString('hex')}`;
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

  await saveMnemonic(mnemonic);

  return {
    spendingAccount,
    viewingPrivKey,
  };
};
