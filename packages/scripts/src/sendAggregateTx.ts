import {
  getAddress,
  Hex,
  hexToBigInt,
  parseUnits,
  toHex,
  zeroAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { client } from './rpc';
import {
  BuildSendRequestBody,
  HistoryItemType,
  SendTxRequestBody,
  signEIP1159Tx,
  USDC,
} from '@raylac/shared';
import { base, optimism } from 'viem/chains';

const sendTx = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );

  const transferAmount = parseUnits('0.1', USDC.decimals).toString();

  const chainId = optimism.id;

  const requestBody: BuildSendRequestBody = {
    token: USDC,
    amount: transferAmount,
    fromAddresses: [account.address],
    toAddress: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    chainId,
  };

  const aggregateSend = await client.buildSend.mutate(requestBody);

  console.log(JSON.stringify(aggregateSend, null, 2));

  const signedStepItems: Hex[] = [];

  for (const step of aggregateSend.inputs) {
    const signedTx = await signEIP1159Tx({
      tx: step.tx,
      account,
    });

    signedStepItems.push(signedTx);
  }

  const sendAggregateTxRequestBody: SendTxRequestBody = {
    signedTxs: signedStepItems,
    chainId,
    transfer: aggregateSend.transfer,
  };

  const response = await client.sendTx.mutate(sendAggregateTxRequestBody);

  const history = await client.getHistory.query({
    addresses: [account.address],
  });

  const pendingTxs = history.filter(tx => tx.type === HistoryItemType.PENDING);
  console.log(pendingTxs);
};

sendTx();
