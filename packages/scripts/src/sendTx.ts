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
  SendTransactionRequestBody,
  SignedBridgeStep,
  SignedTransferStep,
  signEIP1159Tx,
  supportedChains,
} from '@raylac/shared';
import { arbitrum, polygon, base, optimism, zora, zksync } from 'viem/chains';

const sendTx = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );

  const USDC = {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    verified: true,
    logoURI:
      'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
    addresses: [
      {
        chainId: base.id,
        address: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
      },
      {
        chainId: optimism.id,
        address: getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
      },
      {
        chainId: arbitrum.id,
        address: getAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
      },
      {
        chainId: polygon.id,
        address: getAddress('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'),
      },
      {
        chainId: zksync.id,
        address: getAddress('0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4'),
      },
    ],
  };

  /*
  const ETH = {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    verified: true,
    logoURI:
      'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
    addresses: supportedChains
      .filter(chain => chain.id !== polygon.id)
      .map(chain => ({
        chainId: chain.id,
        address: zeroAddress,
      })),
  };
  */

  const transferAmount = parseUnits('1', USDC.decimals).toString();

  const destinationChainId = arbitrum.id;

  const requestBody: BuildMultiChainSendRequestBody = {
    token: USDC,
    amount: transferAmount,
    destinationChainId: destinationChainId,
    sender: account.address,
    to: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
  };

  const multiChainSend = await client.buildMultiChainSend.mutate(requestBody);

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
};

sendTx();