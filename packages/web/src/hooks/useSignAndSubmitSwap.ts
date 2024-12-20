import { CrossChainSwapStep } from '@raylac/shared';
import { useMutation } from '@tanstack/react-query';
import { useSendTransaction } from 'wagmi';

const useSignAndSubmitSwap = () => {
  const { sendTransactionAsync } = useSendTransaction();

  return useMutation({
    mutationFn: async ({ swapSteps }: { swapSteps: CrossChainSwapStep[] }) => {
      for (const step of swapSteps) {
        await sendTransactionAsync({
          to: step.tx.to,
          value: BigInt(step.tx.value),
          data: step.tx.data,
        });
      }
    },
  });
};

export default useSignAndSubmitSwap;
