import { getDefaultAddress, saveUserAddress } from '@/lib/key';
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

      const defaultAddress = await getDefaultAddress();

      await saveUserAddress({
        address,
        type: AddressType.Watch,
        isBackupVerified: true,
        // If there is no default address, we make this the default address
        isDefault: defaultAddress ? false : true,
      });

      await queryClient.invalidateQueries({
        queryKey: userKeys.userAddresses,
      });
    },
  });
};

export default useStartWatch;
