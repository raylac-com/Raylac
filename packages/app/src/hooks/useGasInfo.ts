import { getGasInfo } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';

const useGasInfo = () => {
  const { data: signedInUser } = useSignedInUser();

  return useQuery({
    queryKey: ['gasInfo'],
    queryFn: async () => {
      const gasInfo = await getGasInfo({
        isDevMode: signedInUser.devModeEnabled,
      });
      return gasInfo;
    },
    enabled: !!signedInUser,
  });
};

export default useGasInfo;
