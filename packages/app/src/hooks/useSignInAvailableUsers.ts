import { getSignInAvailableUserIds } from '@/lib/key';
import { client } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';

const useSignInAvailableUsers = () => {
  return useQuery({
    queryKey: ['signInAvailableUsers'],
    queryFn: async () => {
      const userIds = await getSignInAvailableUserIds();

      const users = await Promise.all(
        userIds.map(async userId => {
          console.log("userId", userId);
          const user = await client.getUser.query({
            userId,
          });
          console.log('user', user);

          return user;
        })
      );

      return users;
    },
  });
};

export default useSignInAvailableUsers;
