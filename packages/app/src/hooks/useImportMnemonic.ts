import { useQueryClient } from '@tanstack/react-query';
import {
  getAccountFromMnemonic,
  saveMnemonic,
  savePrivateKey,
  saveUserAddress,
} from '@/lib/key';
import { AddressType } from '@/types';
import { sleep } from '@raylac/shared';
import { useMutation } from '@tanstack/react-query';

const useImportMnemonic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mnemonic }: { mnemonic: string }) => {
      await sleep(300);

      const { account, privKey } = await getAccountFromMnemonic({
        mnemonic,
        accountIndex: 0,
      });

      await saveMnemonic({ address: account.address, mnemonic });
      await savePrivateKey({ address: account.address, privKey });

      await saveUserAddress({
        address: account.address,
        type: AddressType.Mnemonic,
        accountIndex: 0,
        mnemonicGenesisAddress: account.address,
      });

      await queryClient.invalidateQueries({ queryKey: ['userAddresses'] });
    },
  });
};

export default useImportMnemonic;
