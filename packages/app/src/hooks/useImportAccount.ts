import {
  getAccountFromMnemonic,
  saveMnemonic,
  savePrivateKey,
  saveUserAddress,
  setBackupVerificationStatus,
} from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { AddressType } from '@/types';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useImportAccount = () => {
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
        accountIndex: 0,
        type: AddressType.Mnemonic,
      });

      await setBackupVerificationStatus({
        address: account.address,
        status: 'complete',
      });

      await queryClient.invalidateQueries({
        queryKey: userKeys.userAddress,
      });
    },
  });
};

export default useImportAccount;
