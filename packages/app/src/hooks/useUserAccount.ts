import { getUserAddress } from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
// import { getSenderAddressV2 } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';

const useUserAccount = () => {
  return useQuery({
    queryKey: userKeys.userAddress,
    queryFn: async () => {
      const singerAddress = await getUserAddress();

      if (!singerAddress) {
        return null;
      }

      /*
      const address = getSenderAddressV2({
        singerAddress,
      });
      */

      return {
        address: singerAddress,
        singerAddress,
      };
    },
  });
};

export default useUserAccount;
