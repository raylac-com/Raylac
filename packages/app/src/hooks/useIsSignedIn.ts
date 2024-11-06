import { useQuery } from '@tanstack/react-query';
import userKeys from '@/queryKeys/userKeys';
import { getSignedInUserId } from '@/lib/utils';
import { getAuthToken } from '@/lib/auth';
import { getRpcClient } from '@/lib/trpc';

const useIsSignedIn = () => {
  return useQuery({
    queryKey: userKeys.isSignedIn,
    queryFn: async () => {
      const signedInUserId = await getSignedInUserId();
      const authToken = await getAuthToken();

      if (!signedInUserId) {
        return false;
      }

      if (!authToken) {
        return false;
      }

      const client = getRpcClient();
      const user = await client.getUser.query({ userId: signedInUserId });

      if (!user) {
        return false;
      }

      return true;
    },
  });
};

export default useIsSignedIn;
