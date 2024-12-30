import { trpc } from '@/lib/trpc';
import { hexToBigInt } from 'viem';
import useUserAddresses from './useUserAddresses';

const useTokenBalances = () => {
  const { data: userAddresses } = useUserAddresses();

  const result = trpc.getTokenBalances.useQuery(
    {
      addresses: userAddresses?.map(address => address.address) ?? [],
    },
    {
      enabled: !!userAddresses,
    }
  );

  return {
    ...result,
    data: result.data?.map(token => ({
      ...token,
      balance: hexToBigInt(token.balance),
    })),
  };
};

export default useTokenBalances;
