import { Hex, parseEther, parseUnits, toHex, zeroAddress } from 'viem';
import { client } from './rpc';
import { arbitrum, base, optimism } from 'viem/chains';
import { hdKeyToAccount, mnemonicToAccount, HDKey } from 'viem/accounts';
import { TRPCError } from '@trpc/server';
import {
  buildSwapIo,
  getSenderAddressV2,
  GetSwapQuoteRequestBody,
  getUserOpHash,
  SubmitUserOpsRequestBody,
} from '@raylac/shared';
import * as bip39 from 'bip39';

const swap = async () => {
  const seed = bip39.mnemonicToSeedSync(
    'rain profit typical section elephant expire curious defy basic despair toy scene'
  );

  const hdKey = HDKey.fromMasterSeed(seed);

  const account = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  const singerAddress = account.address;

  const sender = getSenderAddressV2({
    singerAddress,
  });

  console.log(sender);

  const tokenBalances = await client.getTokenBalances.query({
    address: sender,
  });

  const inputToken = await client.getToken.query({
    tokenAddress: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
  });

  const outputToken = await client.getToken.query({
    tokenAddress: zeroAddress,
  });

  console.log(inputToken, outputToken);

  const inputTokenBalance = tokenBalances.find(
    token => token.symbol === inputToken.symbol
  );

  if (!inputTokenBalance) {
    throw new Error('Input token balance not found');
  }

  const { inputs, output } = buildSwapIo({
    inputToken,
    outputToken,
    amount: parseUnits('23', 18),
    inputTokenBalance,
  });

  const requestBody: GetSwapQuoteRequestBody = {
    senderAddress: sender,
    inputs: inputs.map(input => ({
      ...input,
      amount: toHex(input.amount),
    })),
    output,
    tradeType: 'EXACT_INPUT',
  };

  const quote = await client.getSwapQuote.mutate(requestBody);

  const userOps = await client.buildSwapUserOp.mutate({
    singerAddress,
    quote,
  });

  console.log(userOps);

  const signedUserOps = await Promise.all(
    userOps.map(async userOp => {
      const userOpHash = getUserOpHash({ userOp });
      const signature = await account.signMessage({
        message: {
          raw: userOpHash,
        },
      });

      return {
        ...userOp,
        signature,
      };
    })
  );

  console.log(signedUserOps);

  const submitUserOpsRequestBody: SubmitUserOpsRequestBody = {
    userOps: signedUserOps,
    swapQuote: quote,
    inputs: inputs.map(input => ({
      ...input,
      amount: toHex(input.amount),
    })),
    output,
  };

  const txReceipts = await client.submitUserOps.mutate(
    submitUserOpsRequestBody
  );

  console.log(txReceipts);
};

swap();
