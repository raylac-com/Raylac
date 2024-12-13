import {
  getAccountFromMnemonic,
  saveMnemonicAndPrivKey,
  setBackupVerificationStatus,
  setUserAddress,
} from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useImportAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mnemonic }: { mnemonic: string }) => {
      await sleep(300);
      const { account, privKey } = await getAccountFromMnemonic(mnemonic);

      await saveMnemonicAndPrivKey({
        mnemonic,
        privKey,
      });
      await setUserAddress(account.address);

      await setBackupVerificationStatus('complete');

      await queryClient.invalidateQueries({
        queryKey: userKeys.userAddress,
      });
    },
  });
};

export default useImportAccount;
