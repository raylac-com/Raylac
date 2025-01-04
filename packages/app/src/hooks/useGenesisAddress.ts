import { getDefaultAddress } from '@/lib/key';
import { useQuery } from '@tanstack/react-query';

const useGenesisAddress = () => {
  return useQuery({
    queryKey: ['genesisAddress'],
    queryFn: getDefaultAddress,
  });
};

export default useGenesisAddress;
