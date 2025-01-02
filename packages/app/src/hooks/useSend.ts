import { useMutation, useQueryClient } from '@tanstack/react-query';

import { trpc } from '@/lib/trpc';
import { getQueryKey } from '@trpc/react-query';
import { SendAggregateTxRequestBody } from '@raylac/shared';

const useSend = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: sendAggregateTx } = trpc.sendAggregateTx.useMutation();

  return useMutation({
    mutationFn: async (request: SendAggregateTxRequestBody) => {
      await sendAggregateTx(request);
      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getHistory),
      });
    },
  });
};

export default useSend;
