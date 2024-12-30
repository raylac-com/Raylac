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
  BuildAggregateSendRequestBody,
  BuildMultiChainSendRequestBody,
  ETH,
  SendAggregateTxRequestBody,
  SignedBridgeStep,
  SignedTransferStep,
  signEIP1159Tx,
  supportedChains,
  USDC,
} from '@raylac/shared';
import { arbitrum, polygon, base, optimism, zora, zksync } from 'viem/chains';

const sendAggregateTx = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );

  const transferAmount = parseUnits('0.1', USDC.decimals).toString();

  const chainId = base.id;

  const requestBody: BuildAggregateSendRequestBody = {
    token: USDC,
    amount: transferAmount,
    fromAddresses: [account.address],
    toAddress: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    chainId,
  };

  const aggregateSend = await client.buildAggregateSend.mutate(requestBody);

  console.log(JSON.stringify(aggregateSend, null, 2));

  const signedStepItems: Hex[] = [];

  for (const step of aggregateSend.inputs) {
    const signedTx = await signEIP1159Tx({
      tx: step.tx,
      account,
    });

    signedStepItems.push(signedTx);
  }

  const sendAggregateTxRequestBody: SendAggregateTxRequestBody = {
    signedTxs: signedStepItems,
    chainId,
  };

  const response = await client.sendAggregateTx.mutate(
    sendAggregateTxRequestBody
  );

  console.log(response);
};

sendAggregateTx();
