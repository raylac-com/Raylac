import { useMutation, useQueryClient } from '@tanstack/react-query';

import { trpc } from '@/lib/trpc';
import {
  signEIP1159Tx,
  BuildBridgeSendReturnType,
  SendBridgeTxRequestBody,
} from '@raylac/shared';
import { getPrivateKey } from '@/lib/key';
import { privateKeyToAccount } from 'viem/accounts';
import { Hex } from 'viem';
import { getQueryKey } from '@trpc/react-query';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';

const useBridgeSend = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: sendBridgeTx, error: sendBridgeTxError } =
    trpc.sendBridgeTx.useMutation({
      throwOnError: false,
    });

  useEffect(() => {
    if (sendBridgeTxError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: sendBridgeTxError.message,
      });
    }
  }, [sendBridgeTxError]);

  return useMutation({
    throwOnError: false,
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

      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalances),
      });

      const txHash = await sendBridgeTx(sendBridgeTxRequestBody);

      return txHash;
    },
  });
};

export default useBridgeSend;
