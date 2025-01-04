import { useMutation } from '@tanstack/react-query';
import * as bip39 from 'bip39';
import { sleep } from '@raylac/shared';
import useImportMnemonic from './useImportMnemonic';

const useCreateAccount = () => {
  const { mutateAsync: importMnemonic } = useImportMnemonic();

  return useMutation({
    mutationFn: async () => {
      await sleep(500);
      const mnemonic = bip39.generateMnemonic();

      const address = await importMnemonic({ mnemonic });

      return address;
    },
  });
};

export default useCreateAccount;
