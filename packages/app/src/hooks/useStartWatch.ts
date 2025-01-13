import { saveUserAddress } from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { AddressType } from '@/types';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Hex } from 'viem';

const useStartWatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address }: { address: Hex }) => {
      await sleep(300);

      await saveUserAddress({
        address,
        type: AddressType.Watch,
        isBackupVerified: true,
        isDefault: false,
      });

      await queryClient.invalidateQueries({
        queryKey: userKeys.userAddresses,
      });
      await queryClient.invalidateQueries({
        queryKey: userKeys.writerAddresses,
      });
    },
  });
};

export default useStartWatch;
