import { getUserAddresses } from '@/lib/key';
import { useQuery } from '@tanstack/react-query';

const useEmbeddedWallets = () => {
  return useQuery({
    queryKey: ['embeddedWallets'],
    queryFn: async () => {
      const addresses = await getUserAddresses();
      return addresses.filter(address => address.isEmbedded);
    },
  });
};

export default useEmbeddedWallets;
