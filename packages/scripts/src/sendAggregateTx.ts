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

  const chainId = arbitrum.id;

  const requestBody: BuildAggregateSendRequestBody = {
    token: USDC,
    amount: transferAmount,
    fromAddresses: [account.address],
    toAddress: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
    chainId,
  };

  const multiChainSend = await client.buildAggregateSend.mutate(requestBody);

  console.log(JSON.stringify(multiChainSend, null, 2));

  const signedStepItems: Hex[] = [];

  for (const step of multiChainSend.inputs) {
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
