import {
  savePrivateKey,
  setBackupVerificationStatus,
  setUserAddress,
} from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const useImportPrivKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ privKey }: { privKey: Hex }) => {
      await sleep(300);
      const account = privateKeyToAccount(privKey);

      await savePrivateKey(privKey);
      await setUserAddress(account.address);

      await setBackupVerificationStatus('complete');

      await queryClient.invalidateQueries({
        queryKey: userKeys.userAddress,
      });
    },
  });
};

export default useImportPrivKey;
