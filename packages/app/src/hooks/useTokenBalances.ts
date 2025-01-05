import { trpc } from '@/lib/trpc';
import useUserAddresses from './useWriterAddresses';

const useTokenBalances = () => {
  const { data: userAddresses } = useUserAddresses();

  return trpc.getTokenBalances.useQuery(
    {
      addresses: userAddresses?.map(address => address.address) ?? [],
    },
    {
      enabled: !!userAddresses,
    }
  );
};

export default useTokenBalances;
