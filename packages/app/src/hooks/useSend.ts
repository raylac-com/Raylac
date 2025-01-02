import { useMutation, useQueryClient } from '@tanstack/react-query';

import { trpc } from '@/lib/trpc';
import { getQueryKey } from '@trpc/react-query';
import {
  signEIP1159Tx,
  BuildAggregateSendReturnType,
  SendAggregateTxRequestBody,
} from '@raylac/shared';
import { getPrivateKey } from '@/lib/key';
import { privateKeyToAccount } from 'viem/accounts';
import { Hex } from 'viem';

const useSend = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: sendAggregateTx } = trpc.sendAggregateTx.useMutation();

  return useMutation({
    mutationFn: async ({
      aggregatedSend,
      chainId,
    }: {
      aggregatedSend: BuildAggregateSendReturnType;
      chainId: number;
    }) => {
      const privateKey = await getPrivateKey(aggregatedSend.transfer.from);

      if (!privateKey) {
        throw new Error('Private key not found');
      }

      const privateKeyAccount = privateKeyToAccount(privateKey);

      const signedTxs: Hex[] = [];
      for (const step of aggregatedSend.inputs) {
        const singedTx = await signEIP1159Tx({
          tx: step.tx,
          account: privateKeyAccount,
        });

        signedTxs.push(singedTx);
      }

      const sendAggregateTxRequestBody: SendAggregateTxRequestBody = {
        signedTxs,
        chainId,
        transfer: {
          token: aggregatedSend.transfer.token,
          amount: aggregatedSend.transfer.amount,
          from: aggregatedSend.transfer.from,
          to: aggregatedSend.transfer.to,
        },
      };

      await sendAggregateTx(sendAggregateTxRequestBody);

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getHistory),
      });
    },
  });
};

export default useSend;
