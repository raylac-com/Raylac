import 'dotenv/config';
import axios from 'axios';
import {
  concanumberToHe,
  sizex,
  t,
  Hex,
  parseUnits,
  concat,
  numberToHex,
  size,
} from 'viem';
import { base } from 'viem/chains';
import {
  getWalletClient,
  ZeroExSwapPriceResponse,
  ZeroExSwapQuoteResponse,
} from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';

const DEGEN_CONTRACT = '0x4ed4e862860bed51a9570b96d89af5e1b0efefed';
const WETH_CONTRACT = '0x4200000000000000000000000000000000000006';

const test0x = async () => {
  /*
  const price = await axios.get<ZeroExSwapPriceResponse>(
    'http://api.0x.org/swap/permit2/price',
    {
      params: {
        chainId: base.id,
        buyToken: WETH_CONTRACT,
        sellToken: DEGEN_CONTRACT,
        sellAmount: '505062403499656554617',
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
        '0x-version': 'v2',
      },
    }
  );

  */

  const { data: quote } = await axios.get<ZeroExSwapQuoteResponse>(
    'http://api.0x.org/swap/permit2/quote',
    {
      params: {
        chainId: base.id,
        buyToken: WETH_CONTRACT,
        sellToken: DEGEN_CONTRACT,
        sellAmount: '505062403499656554617',
        taker: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
        '0x-version': 'v2',
      },
    }
  );

  const eip712 = quote.permit2.eip712 as any;

  console.log({ eip712 });

  // Sign with the signer address

  const account = privateKeyToAccount(process.env.BUNDLER_PRIVATE_KEY as Hex);

  // Sign the permit2 data
  const signature = await account.signTypedData(quote.permit2.eip712 as any);

  const signatureLengthInHex = numberToHex(size(signature), {
    signed: false,
    size: 32,
  });

  let transaction = quote.transaction;

  transaction.data = concat([
    transaction.data,
    signatureLengthInHex,
    signature,
  ]);

  console.log({ signature });
};

test0x();
