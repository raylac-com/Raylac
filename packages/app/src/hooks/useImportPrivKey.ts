import {
  savePrivateKey,
  setBackupVerificationStatus,
  saveUserAddress,
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

export default useImportPrivKey;
