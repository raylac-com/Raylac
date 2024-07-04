import { useQuery } from '@tanstack/react-query';
import userKeys from '@/queryKeys/userKeys';
import { getSignedInUserId } from '@/lib/utils';
import { getAuthToken } from '@/lib/auth';

const useIsSignedIn = () => {
  return useQuery({
    queryKey: userKeys.isSignedIn,
    queryFn: async () => {
      const signedInUser = await getSignedInUserId();
      const authToken = await getAuthToken();

      if (!signedInUser) {
        console.log('No signed in user');
      }

      if (!authToken) {
        console.log('No auth token');
      }

      return !!signedInUser && !!authToken;
    },
  });
};

export default useIsSignedIn;
