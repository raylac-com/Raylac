import { useMutation } from '@tanstack/react-query';
import * as bip39 from 'bip39';
import {
  getAccountFromMnemonic,
  saveMnemonicAndPrivKey,
  setUserAddress,
} from '@/lib/key';

const useCreateAccount = () => {
  return useMutation({
    mutationFn: async () => {
      const mnemonic = bip39.generateMnemonic();
      const { account, privKey } = await getAccountFromMnemonic(mnemonic);

      await setUserAddress(account.address);
      await saveMnemonicAndPrivKey({ mnemonic, privKey });
    },
  });
};

export default useCreateAccount;
