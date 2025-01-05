import { useMutation, useQueryClient } from '@tanstack/react-query';

import { trpc } from '@/lib/trpc';
import { getQueryKey } from '@trpc/react-query';
import {
  signEIP1159Tx,
  BuildSendReturnType,
  SendTxRequestBody,
} from '@raylac/shared';
import { getPrivateKey } from '@/lib/key';
import { privateKeyToAccount } from 'viem/accounts';

const useSend = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: sendTx } = trpc.sendTx.useMutation();

  return useMutation({
    mutationFn: async ({
      sendData,
      chainId,
    }: {
      sendData: BuildSendReturnType;
      chainId: number;
    }) => {
      const privateKey = await getPrivateKey(sendData.transfer.from);

      if (!privateKey) {
        throw new Error('Private key not found');
      }

      const privateKeyAccount = privateKeyToAccount(privateKey);

      const signedTx = await signEIP1159Tx({
        tx: sendData.tx,
        account: privateKeyAccount,
      });

      const sendTxRequestBody: SendTxRequestBody = {
        signedTx,
        chainId,
        transfer: {
          token: sendData.transfer.token,
          amount: sendData.transfer.amount,
          from: sendData.transfer.from,
          to: sendData.transfer.to,
        },
      };

      const txHash = await sendTx(sendTxRequestBody);

      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalances),
      });

      return txHash;
    },
  });
};

export default useSend;
