import * as bip39 from 'bip39';
import { Hex } from 'viem';
import { HDKey, hdKeyToAccount } from 'viem/accounts';
import {
  saveMnemonic,
  saveSpendingPrivKey,
  saveViewingPrivKey,
} from '@/lib/key';

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

  const spendingPrivKey = hdKeyToPrivateKey(spendingAccount.getHdKey());
  const viewingPrivKey = hdKeyToPrivateKey(viewingAccount.getHdKey());

  await saveMnemonic(mnemonic);
  await saveSpendingPrivKey(spendingPrivKey);
  await saveViewingPrivKey(viewingPrivKey);

  return {
    spendingPubKey: spendingAccount.publicKey,
    viewingPrivKey,
  };
};
