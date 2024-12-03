import { parseEther, toHex } from 'viem';
import { client } from './rpc';
import { arbitrum, base } from 'viem/chains';
import { hdKeyToAccount, mnemonicToAccount, signMessage } from 'viem/accounts';
import {
  getSenderAddressV2,
  getUserOpHash,
  getWalletClient,
  UserOperation,
} from '@raylac/shared';

const test = async () => {
  const account = mnemonicToAccount(
    'rain profit typical section elephant expire curious defy basic despair toy scene'
  );

  const hdKey = account.getHdKey();

  const spendingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  const singerAddress = spendingAccount.address;

  const sender = getSenderAddressV2({
    singerAddress,
  });

  const quote = await client.getSwapQuote.query({
    senderAddress: singerAddress,
    inputTokenAddress: '0x0000000000000000000000000000000000000000',
    outputTokenAddress: '0x0000000000000000000000000000000000000000',
    amount: toHex(parseEther('0.00005')),
    tradeType: 'EXACT_INPUT',
  });

  console.log(quote);
};

test();
