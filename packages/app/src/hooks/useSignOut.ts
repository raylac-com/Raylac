import { deleteAuthToken } from '@/lib/auth';
import { deleteMnemonic } from '@/lib/key';
import { deleteSignedInUser } from '@/lib/utils';
import userKeys from '@/queryKeys/userKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const signOut = async () => {
  await deleteMnemonic();
  await deleteAuthToken();
  await deleteSignedInUser();
};

/**
 * Hook to delete the auth token from SecureStorage and the signed in user from AsyncStorage.
 * This doesn't delete the mnemonic, so the user can sign in again.
 */
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
