import { getSingedInUserAddress } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const useUserAddress = () => {
  return useQuery({
    queryKey: ['userAddress'],
    queryFn: () => {
      const address = getSingedInUserAddress();
      return address;
    },
  });
};

export default useUserAddress;
