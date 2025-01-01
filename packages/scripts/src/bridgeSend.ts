import {
  BuildBridgeSendRequestBody,
  ETH,
  SendAggregateTxRequestBody,
  signEIP1159Tx,
} from '@raylac/shared';
import { base } from 'viem/chains';
import { arbitrum } from 'viem/chains';
import { Hex, parseUnits } from 'viem';
import { client } from './rpc';
import { privateKeyToAccount } from 'viem/accounts';

const bridgeSend = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );

  const fromChainId = base.id;
  const toChainId = arbitrum.id;

  const requestBody: BuildBridgeSendRequestBody = {
    from: account.address,
    to: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    token: ETH,
    amount: parseUnits('0.0001', 18).toString(),
    fromChainId,
    toChainId,
  };

  const response = await client.buildBridgeSend.mutate(requestBody);
  console.log(response);

  const signedStepItems: Hex[] = [];

  for (const step of response.steps) {
    const signedTx = await signEIP1159Tx({
      tx: step.tx,
      account,
    });

    signedStepItems.push(signedTx);
  }

  const sendAggregateTxRequestBody: SendAggregateTxRequestBody = {
    signedTxs: signedStepItems,
    chainId: fromChainId,
  };

  await client.sendAggregateTx.mutate(sendAggregateTxRequestBody);
};

bridgeSend();
