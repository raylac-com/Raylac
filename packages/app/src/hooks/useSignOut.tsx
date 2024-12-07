import { deleteUserAddress } from '@/lib/key';
import { deleteMnemonicAndPrivKey } from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await deleteMnemonicAndPrivKey();
      await deleteUserAddress();

      await queryClient.invalidateQueries({ queryKey: userKeys.userAddress });
    },
  });
};
