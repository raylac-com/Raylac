import { getUserAddress } from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { useQuery } from '@tanstack/react-query';

const useUserAddress = () => {
  return useQuery({
    queryKey: userKeys.userAddress,
    queryFn: async () => {
      const address = await getUserAddress();
      return address;
    },
  });
};

export default useUserAddress;
