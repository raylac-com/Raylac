import { getGenesisAddress } from '@/lib/key';
import { useQuery } from '@tanstack/react-query';

const useGenesisAddress = () => {
  return useQuery({
    queryKey: ['genesisAddress'],
    queryFn: getGenesisAddress,
  });
};

export default useGenesisAddress;
