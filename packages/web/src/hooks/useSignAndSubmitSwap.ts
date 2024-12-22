import { CrossChainSwapStep } from '@raylac/shared';
import { useMutation } from '@tanstack/react-query';
import { useSendTransaction } from 'wagmi';

const useSignAndSubmitSwap = () => {
  const { sendTransaction } = useSendTransaction();

  return useMutation({
    mutationFn: async ({ swapSteps }: { swapSteps: CrossChainSwapStep[] }) => {
      for (const step of swapSteps) {
        /*
        const gasInfo = await getGasInfo({
          chainIds: [step.originChainId],
        });

        const maxPriorityFeePerGas = gasInfo[0].maxPriorityFeePerGas;
        const maxFeePerGas = gasInfo[0].baseFeePerGas + maxPriorityFeePerGas;
        */

        await sendTransaction({
          to: step.tx.to,
          value: BigInt(step.tx.value),
          data: step.tx.data,
          chainId: step.originChainId,
        });
      }
    },
  });
};

export default useSignAndSubmitSwap;
