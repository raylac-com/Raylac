import { useMutation } from '@tanstack/react-query';
import * as bip39 from 'bip39';
import {
  getAccountFromMnemonic,
  saveMnemonic,
  savePrivateKey,
  saveUserAddress,
} from '@/lib/key';
import { sleep } from '@raylac/shared';
import { useQueryClient } from '@tanstack/react-query';

const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await sleep(300);
      const mnemonic = bip39.generateMnemonic();
      const { account, privKey } = await getAccountFromMnemonic(mnemonic);

      await saveMnemonic({ address: account.address, mnemonic });
      await savePrivateKey({ address: account.address, privKey });
      await saveUserAddress(account.address);

      await queryClient.invalidateQueries({ queryKey: ['userAddresses'] });
    },
  });
};

export default useCreateAccount;
