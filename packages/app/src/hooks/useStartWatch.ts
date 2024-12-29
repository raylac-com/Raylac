import { saveUserAddress, setBackupVerificationStatus } from '@/lib/key';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation } from '@tanstack/react-query';
import { Hex } from 'viem';

const useStartWatch = () => {
  return useMutation({
    mutationFn: async ({ address }: { address: Hex }) => {
      await sleep(300);

      await saveUserAddress(address);

      await setBackupVerificationStatus({ address, status: 'complete' });
    },
  });
};

export default useStartWatch;
