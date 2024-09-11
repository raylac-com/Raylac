import 'dotenv/config';
import { getAlchemyRpcUrl, getQuote, getWalletClient } from '@raylac/shared';
import { Hex, parseUnits } from 'viem';
import * as chains from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

if (!process.env.ALCHEMY_API_KEY) {
  throw new Error('Missing ALCHEMY_API_KEY');
}

if (!process.env.RELAYER_PRIV_KEY) {
  throw new Error('Missing RELAYER_PRIV_KEY');
}

const testRelay = async () => {
  const account = privateKeyToAccount(process.env.RELAYER_PRIV_KEY as Hex);

  const walletClient = getWalletClient({
    chain: chains.polygon,
    rpcUrl:
      'https://polygon-mainnet.g.alchemy.com/v2/UfWNqNlX3Wq4oJtE0iObWWgcenwyICcp',

    /*
    getAlchemyRpcUrl({
      chain: chains.polygon,
      apiKey: process.env.ALCHEMY_API_KEY as string,
    }),
    */
  });

  /*
  const chainIds = [
    chains.optimism.id,
    chains.base.id,
    chains.arbitrum.id,
    chains.blast.id,
    chains.mantle.id,
    chains.scroll.id,
    chains.zkSync.id,
    chains.polygon.id,
  chains.polygonZkEvm.id,
  ];
  const currencies = await getCurrencies({
    chainIds,
  });

  console.log(currencies.find((currency) => currency.address?.toLowerCase() === '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase()));
  */

  const fromAddress = '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196';

  const quote = await getQuote({
    user: fromAddress,
    recipient: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    originChainId: chains.polygon.id,
    destinationChainId: chains.base.id,
    //    originCurrency: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    //    originCurrency: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    originCurrency: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    destinationCurrency: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount: parseUnits('0.035', 18).toString(),
    tradeType: 'EXACT_INPUT',
  });

  /*
  console.log({ quote });
  console.log({ fees: quote.fees });
  console.log({ relayerFee: quote.fees.relayer });
  console.log({ steps: quote.steps });
  console.log({ items: quote.steps[0].items });
  console.log({ data: quote.steps[0].items[0].data });
  console.log({ check: quote.steps[0].items[0].check });
  */

  for (const step of quote.steps) {
    console.log(step.id, step.action, step.description);
    for (const item of step.items) {
      console.log('from', account.address);

      const tx = await walletClient.sendTransaction({
        account,
        to: item.data.to,
        data: item.data.data,
        maxFeePerGas: BigInt(item.data.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(item.data.maxPriorityFeePerGas),
        // gas: BigInt(item.data.gas),
      });

      /*
      const tx = await walletClient.sendRawTransaction({
        serializedTransaction,
      });
      */

      console.log({ tx });
    }
  }
};

testRelay();
