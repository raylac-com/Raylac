import { CrossChainSwapStep, getPublicClient } from '@raylac/shared';
import { useMutation } from '@tanstack/react-query';
import { useSendTransaction } from 'wagmi';

const useSwap = () => {
  const { sendTransactionAsync } = useSendTransaction();

  return useMutation({
    mutationFn: async ({ swapSteps }: { swapSteps: CrossChainSwapStep[] }) => {
      for (const step of swapSteps) {
        const txHash = await sendTransactionAsync({
          to: step.tx.to,
          value: BigInt(step.tx.value),
          data: step.tx.data,
          chainId: step.originChainId,
        });

        const publicClient = getPublicClient({ chainId: step.originChainId });

        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
      }
    },
  });
};

export default useSwap;
