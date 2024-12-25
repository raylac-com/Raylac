import { saveAddress } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Hex } from 'viem';

const useAddAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      address,
      connectorId,
    }: {
      address: Hex;
      connectorId: string;
    }) => {
      saveAddress({ address, connectorId });

      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export default useAddAddress;
