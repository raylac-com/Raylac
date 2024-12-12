import { setBackupVerificationStatus, setUserAddress } from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Hex } from 'viem';

const useStartWatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address }: { address: Hex }) => {
      await sleep(300);

      await setUserAddress(address);

      await setBackupVerificationStatus('complete');

      await queryClient.invalidateQueries({
        queryKey: userKeys.isSignedIn,
      });
      await queryClient.invalidateQueries({
        queryKey: userKeys.userAddress,
      });
    },
  });
};

export default useStartWatch;
