import { useMutation, useQueryClient } from '@tanstack/react-query';

import { trpc } from '@/lib/trpc';
import { getQueryKey } from '@trpc/react-query';
import {
  signEIP1159Tx,
  BuildBridgeSendReturnType,
  SendBridgeTxRequestBody,
} from '@raylac/shared';
import { getPrivateKey } from '@/lib/key';
import { privateKeyToAccount } from 'viem/accounts';
import { Hex } from 'viem';

const useBridgeSend = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: sendBridgeTx } = trpc.sendBridgeTx.useMutation();

  return useMutation({
    mutationFn: async ({
      sendData,
      chainId,
    }: {
      sendData: BuildBridgeSendReturnType;
      chainId: number;
    }) => {
      const privateKey = await getPrivateKey(sendData.transfer.from);

      if (!privateKey) {
        throw new Error('Private key not found');
      }

      const privateKeyAccount = privateKeyToAccount(privateKey);

      const signedTxs: Hex[] = [];
      for (const step of sendData.steps) {
        const signedTx = await signEIP1159Tx({
          tx: step.tx,
          account: privateKeyAccount,
        });
        signedTxs.push(signedTx);
      }

      const sendBridgeTxRequestBody: SendBridgeTxRequestBody = {
        signedTxs,
        chainId,
        transfer: {
          token: sendData.transfer.token,
          amount: sendData.transfer.amount,
          from: sendData.transfer.from,
          to: sendData.transfer.to,
        },
      };

      await sendBridgeTx(sendBridgeTxRequestBody);

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getHistory),
      });
    },
  });
};

export default useBridgeSend;
