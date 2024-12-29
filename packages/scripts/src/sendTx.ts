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
  BuildMultiChainSendRequestBody,
  ETH,
  SignedBridgeStep,
  SignedTransferStep,
  signEIP1159Tx,
  supportedChains,
  USDC,
} from '@raylac/shared';
import { arbitrum, polygon, base, optimism, zora, zksync } from 'viem/chains';

const sendTx = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );

  const transferAmount = parseUnits('0.1', USDC.decimals).toString();

  const destinationChainId = arbitrum.id;

  const requestBody: BuildMultiChainSendRequestBody = {
    token: USDC,
    amount: transferAmount,
    destinationChainId: destinationChainId,
    sender: account.address,
    to: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
  };

  const multiChainSend = await client.buildMultiChainSend.mutate(requestBody);

  console.log(JSON.stringify(multiChainSend, null, 2));

  const signedStepItems: SignedBridgeStep[] = [];

  for (const step of multiChainSend.bridgeSteps) {
    const signature = await signEIP1159Tx({
      tx: step.tx,
      account,
    });

    signedStepItems.push({
      ...step,
      signature: signature,
    });
  }

  const transferSig = await signEIP1159Tx({
    tx: multiChainSend.transferStep.tx,
    account,
  });

  /*
  const signedTransfer: SignedTransferStep = {
    ...multiChainSend.transferStep,
    signature: transferSig,
  };

  const sendTxRequestBody: SendTransactionRequestBody = {
    signedBridgeSteps: signedStepItems,
    signedTransfer,
    sender: account.address,
    token: USDC,
    amount: transferAmount,
  };

  const response = await client.sendTransaction.mutate(sendTxRequestBody);

  console.log(response);
  */
};

sendTx();
