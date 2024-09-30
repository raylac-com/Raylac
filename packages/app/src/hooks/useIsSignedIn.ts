import { useQuery } from '@tanstack/react-query';
import userKeys from '@/queryKeys/userKeys';
import { getSignedInUserId } from '@/lib/utils';
import { getAuthToken } from '@/lib/auth';
import { useSignIn } from './useSIgnIn';
import { getMnemonic } from '@/lib/key';

const useIsSignedIn = () => {
  const { mutateAsync: signIn } = useSignIn();

  return useQuery({
    queryKey: userKeys.isSignedIn,
    queryFn: async () => {
      const signedInUserId = await getSignedInUserId();
      const authToken = await getAuthToken();

      if (signedInUserId && authToken) {
        console.log('Already signed in');
        return true;
      }

      const mnemonic = await getMnemonic();

      if (!mnemonic) {
        console.log('No mnemonic');
        return false;
      }

      await signIn({ mnemonic });

      return true;
    },
  });
};

export default useIsSignedIn;
