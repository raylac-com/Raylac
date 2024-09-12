import 'dotenv/config';
import {
  getAlchemyRpcUrl,
  getCurrencies,
  getQuoteFromRelay,
  getWalletClient,
} from '@raylac/shared';
import { Hex, parseUnits, zeroAddress } from 'viem';
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
    chain: chains.baseSepolia,
    rpcUrl: getAlchemyRpcUrl({
      chain: chains.baseSepolia,
    }),
  });

  const quote = await getQuoteFromRelay({
    user: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    recipient: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    originChainId: chains.base.id,
    destinationChainId: chains.optimism.id,
    originCurrency: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    destinationCurrency: '0x76fb31fb4af56892a25e32cfc43de717950c9278',
    //    originCurrency: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    //    originCurrency: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    //    destinationCurrency: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    //    originCurrency: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount: parseUnits('10', 6).toString(),
    tradeType: 'EXACT_INPUT',
  });

  const fees = quote.fees;

  const gas = parseFloat(fees.gas.amountUsd);
  const relayerGas = parseFloat(fees.relayerGas.amountUsd);
  const relayerService = parseFloat(fees.relayerService.amountUsd);
  const app = parseFloat(fees.app.amountUsd);

  const totalFeeUsd = gas + relayerGas + relayerService + app;

  console.log({
    gas,
    relayerGas,
    relayerService: fees.relayerService,
    app,
    totalFeeUsd,
  });

  /*
  console.log({ fees: quote.fees });
  console.log({ relayerFee: quote.fees.relayer });
  console.log({ steps: quote.steps });
  console.log({ items: quote.steps[0].items });
  console.log({ data: quote.steps[0].items[0].data });
  console.log({ check: quote.steps[0].items[0].check });

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
        value: BigInt(item.data.value),
        // gas: BigInt(item.data.gas),
      });

      

      console.log({ tx });
    }
  }
    */
};

testRelay();
