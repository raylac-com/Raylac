import { deleteAddress } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Hex } from 'viem';

const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Hex) => {
      deleteAddress(address);

      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export default useDeleteAddress;
