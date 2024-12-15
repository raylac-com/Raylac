import { trpc } from '@/lib/trpc';
import useUserAccount from './useUserAccount';
import { hexToBigInt, zeroAddress } from 'viem';

const useTokenBalances = () => {
  const { data: userAccount } = useUserAccount();

  const result = trpc.getTokenBalances.useQuery(
    {
      address: userAccount?.address ?? zeroAddress,
    },
    {
      enabled: !!userAccount,
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
