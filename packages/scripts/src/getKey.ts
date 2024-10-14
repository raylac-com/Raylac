import { getSpendingPrivKey, getViewingPrivKey } from '@raylac/shared';
import { mnemonicToSeedSync } from 'bip39';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';

const getKey = async () => {
  const mnemonic =
    'rain profit typical section elephant expire curious defy basic despair toy scene';

  //    const seed = mnemonicToSeedSync(mnemonic);
  const account = mnemonicToAccount(mnemonic);

  const spendingPrivKey = getSpendingPrivKey(mnemonic);
  const viewingPrivKey = getViewingPrivKey(mnemonic);

  const spendingPubKey = privateKeyToAccount(spendingPrivKey);
  const viewingPubKey = privateKeyToAccount(viewingPrivKey);

  console.log('spendingPrivKey', spendingPrivKey);
  console.log('viewingPrivKey', viewingPrivKey);

  console.log('spendingPubKey', spendingPubKey);
  console.log('viewingPubKey', viewingPubKey);
};

getKey();
