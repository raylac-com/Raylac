import { getGasInfo, supportedChains } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';

const useGasInfo = () => {
  const { data: signedInUser } = useSignedInUser();

  return useQuery({
    queryKey: ['gasInfo'],
    queryFn: async () => {
      const gasInfo = await getGasInfo({
        chainIds: supportedChains.map(chain => chain.id),
      });
      return gasInfo;
    },
    enabled: !!signedInUser,
  });
};

export default useGasInfo;
