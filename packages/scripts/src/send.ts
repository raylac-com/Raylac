import {
  BuildBridgeSendRequestBody,
  BuildSendRequestBody,
  ETH,
  SendBridgeTxRequestBody,
  SendTxRequestBody,
  signEIP1159Tx,
  USDC,
} from '@raylac/shared';
import { base, mainnet } from 'viem/chains';
import { arbitrum } from 'viem/chains';
import { Hex, parseUnits } from 'viem';
import { client } from './rpc';
import { privateKeyToAccount } from 'viem/accounts';

const send = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );

  const chainId = mainnet.id;

  const requestBody: BuildSendRequestBody = {
    fromAddress: account.address,
    toAddress: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    token: ETH,
    amount: '1000000000000000000',
    chainId: chainId,
  };

  const response = await client.buildSend.mutate(requestBody);
  console.log(response);
};

send();
