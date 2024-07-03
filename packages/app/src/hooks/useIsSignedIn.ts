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

      return !!signedInUser && !!authToken;
    },
  });
};

export default useIsSignedIn;
