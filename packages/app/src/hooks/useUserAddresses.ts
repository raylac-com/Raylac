import { getUserAddresses } from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { useQuery } from '@tanstack/react-query';

const useUserAddresses = () => {
  return useQuery({
    queryKey: userKeys.userAddresses,
    queryFn: () => getUserAddresses(),
    gcTime: 0,
  });
};

export default useUserAddresses;
