import { parseEther, parseUnits, toHex } from 'viem';
import { client } from './rpc';
import { arbitrum, base } from 'viem/chains';
import { hdKeyToAccount, mnemonicToAccount, signMessage } from 'viem/accounts';
import { TRPCError } from '@trpc/server';
import {
  getSenderAddressV2,
  getUserOpHash,
  getWalletClient,
  TRPCErrorMessage,
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

  try {
    const quote = await client.getSwapQuote.mutate({
      senderAddress: singerAddress,
      inputTokenAddress: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
      outputTokenAddress: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
      amount: toHex(parseUnits('1', 18)),
      tradeType: 'EXACT_INPUT',
    });
  } catch (error: TRPCError | unknown) {
    if (
      error instanceof TRPCError &&
      error.message === TRPCErrorMessage.SWAP_AMOUNT_TOO_SMALL
    ) {
      console.log(
        `Amount is too small, please increase the amount and try again. ${error.cause}`
      );
    } else {
      console.log(error);
    }
  }
};

test();
