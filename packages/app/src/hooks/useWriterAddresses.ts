import { getUserAddresses } from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { AddressType } from '@/types';
import { useQuery } from '@tanstack/react-query';

const useWriterAddresses = () => {
  return useQuery({
    queryKey: userKeys.writerAddresses,
    queryFn: async () => {
      const addresses = await getUserAddresses();
      return addresses.filter(
        address =>
          address.type === AddressType.PrivateKey ||
          address.type === AddressType.Mnemonic
      );
    },
    gcTime: 0,
  });
};

export default useWriterAddresses;
