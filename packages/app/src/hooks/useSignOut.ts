import { deleteAuthToken } from '@/lib/auth';
import { deleteSignedInUser } from '@/lib/utils';
import userKeys from '@/queryKeys/userKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const signOut = async () => {
  await deleteAuthToken();
  await deleteSignedInUser();
};

const useSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await signOut();
      await queryClient.invalidateQueries({
        queryKey: userKeys.signedInUser,
      });

      await queryClient.invalidateQueries({
        queryKey: userKeys.isSignedIn,
      });
    },
  });
};

export default useSignOut;
