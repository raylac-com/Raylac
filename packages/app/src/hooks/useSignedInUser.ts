import { useQuery } from '@tanstack/react-query';
import { getSignedInUserId } from '@/lib/utils';
import { client } from '@/lib/trpc';
import userKeys from '@/queryKeys/userKeys';
import { User } from '@/types';

const getSignedInUser = async (): Promise<User | null> => {
  const signedInUserId = await getSignedInUserId();

  if (signedInUserId) {
    const user = await client.getUser.query({
      userId: signedInUserId,
    });

    return user;
  }

  return null;
};

const useSignedInUser = () => {
  return useQuery({
    queryKey: userKeys.signedInUser,
    queryFn: async () => {
      return await getSignedInUser();
    },
  });
};

export default useSignedInUser;
