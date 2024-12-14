import { Hex, parseEther, parseUnits, toHex, zeroAddress } from 'viem';
import { client } from './rpc';
import { arbitrum, base, optimism } from 'viem/chains';
import {
  hdKeyToAccount,
  mnemonicToAccount,
  HDKey,
  privateKeyToAccount,
} from 'viem/accounts';
import { TRPCError } from '@trpc/server';
import {
  buildSwapIo,
  getGasInfo,
  getPublicClient,
  getSenderAddressV2,
  GetSwapQuoteRequestBody,
  getUserOpHash,
  getWalletClient,
  SubmitSwapRequestBody,
  SubmitUserOpsRequestBody,
} from '@raylac/shared';
import * as bip39 from 'bip39';

const swap = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );

  const sender = account.address;

  const tokenBalances = await client.getTokenBalances.query({
    address: sender,
  });

  const inputToken = await client.getToken.query({
    tokenAddress: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
  });

  const outputToken = await client.getToken.query({
    tokenAddress: zeroAddress,
  });

  const inputTokenBalance = tokenBalances.find(
    token => token.token.symbol === inputToken.symbol
  );

  if (!inputTokenBalance) {
    throw new Error('Input token balance not found');
  }

  const { inputs, output } = buildSwapIo({
    inputToken,
    outputToken,
    amount: parseUnits('10', 18),
    inputTokenBalance: inputTokenBalance,
  });

  console.log('inputs');
  console.log(inputs);
  console.log(inputs[0].token.addresses);
  console.log('output');
  console.log(output.token.addresses);

  const requestBody: GetSwapQuoteRequestBody = {
    senderAddress: sender,
    inputs: inputs.map(input => ({
      ...input,
      amount: toHex(input.amount),
    })),
    output,
    tradeType: 'EXACT_INPUT',
  };

  console.log('requestBody');
  console.log(requestBody);

  const quote = await client.getSwapQuote.mutate(requestBody);

  const nonces: Record<number, number> = {};

  const chains = new Set(
    quote.steps.flatMap(step => step.items.flatMap(item => item.data.chainId))
  );

  for (const chainId of chains) {
    const publicClient = getPublicClient({ chainId });
    nonces[chainId] = await publicClient.getTransactionCount({
      address: account.address,
    });
  }

  const signedTxs: {
    chainId: number;
    signedTx: Hex;
    sender: Hex;
  }[] = [];
  for (const step of quote.steps) {
    for (const item of step.items) {
      console.log('item');
      console.log(item);
      const walletClient = getWalletClient({ chainId: item.data.chainId });

      const gas = item.data.gas ? BigInt(item.data.gas) : BigInt(500_000);

      const nonce = nonces[item.data.chainId];

      const gasInfo = await getGasInfo({
        chainIds: [item.data.chainId],
      });

      const maxPriorityFeePerGas =
        (gasInfo[0].maxPriorityFeePerGas * BigInt(110)) / BigInt(100);
      const maxFeePerGas = gasInfo[0].baseFeePerGas + maxPriorityFeePerGas;

      const tx = {
        account: account,
        to: item.data.to,
        value: BigInt(item.data.value),
        data: item.data.data,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gas,
        nonce,
        chainId: item.data.chainId,
      };

      nonces[item.data.chainId]++;

      console.log(`Signing tx`);
      console.log(tx);

      const signedTx = await account.signTransaction({
        ...tx,
        type: 'eip1559',
      });

      console.log(signedTx);

      signedTxs.push({
        chainId: item.data.chainId,
        signedTx: signedTx,
        sender: account.address,
      });
    }
  }

  const submitSwapRequestBody: SubmitSwapRequestBody = {
    swapQuote: quote,
    signedTxs,
  };

  const txReceipts = await client.submitSwap.mutate(submitSwapRequestBody);

  console.log(txReceipts);

  /*
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
  */
};

swap();
