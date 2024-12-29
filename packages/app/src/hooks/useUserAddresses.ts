import { getUserAddresses } from '@/lib/key';
import { useQuery } from '@tanstack/react-query';

const useUserAddresses = () => {
  return useQuery({
    queryKey: ['userAddresses'],
    queryFn: () => getUserAddresses(),
  });
};

export default useUserAddresses;
