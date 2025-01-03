import { getGasInfo } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';

const useGasInfo = ({ chainId }: { chainId: number }) => {
  const { data: gasInfo } = useQuery({
    queryKey: ['gasInfo', chainId],
    queryFn: async () => {
      const gasInfo = (await getGasInfo({ chainIds: [chainId] }))[0];

      const baseFeePerGas = BigInt(gasInfo.baseFeePerGas);
      const maxPriorityFeePerGas = BigInt(gasInfo.maxPriorityFeePerGas);

      const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas;

      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    },
  });

  return gasInfo;
};

export default useGasInfo;
