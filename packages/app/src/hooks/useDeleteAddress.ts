import { Hex } from 'viem';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeAddress } from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';

const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Hex) => {
      await removeAddress(address);

      await queryClient.invalidateQueries({
        queryKey: userKeys.userAddresses,
      });
      await queryClient.invalidateQueries({
        queryKey: userKeys.writerAddresses,
      });
    },
  });
};

export default useDeleteAddress;
