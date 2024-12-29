import {
  getAccountFromMnemonic,
  saveMnemonic,
  savePrivateKey,
  saveUserAddress,
  setBackupVerificationStatus,
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

      await saveMnemonic({ address: account.address, mnemonic });
      await savePrivateKey({ address: account.address, privKey });
      await saveUserAddress(account.address);

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
