import prisma from '@/lib/prisma';
import { handleNewStealthAccount } from '@/lib/stealthAccount';
import { sleep } from '@/utils';
import {
  ERC20Abi,
  RaylacAccountAbi,
  RelayGetQuoteResponseBody,
  StealthAddressWithEphemeral,
  UserOperation,
  getPublicClient,
  getTokenBalance,
  sendUserOperation,
} from '@raylac/shared';
import { decodeFunctionData, Hex, zeroAddress } from 'viem';

const getTransferDataFromUserOp = (userOp: UserOperation) => {
  const { functionName, args } = decodeFunctionData({
    abi: RaylacAccountAbi,
    data: userOp.callData,
  });

  if (functionName !== 'execute') {
    throw new Error("Function name must be 'execute'");
  }

  const data = args[2];

  if (data === '0x') {
    return {
      tokenAddress: zeroAddress,
      to: args[0],
      amount: args[1],
    };
  } else {
    const transferData = decodeFunctionData({
      abi: ERC20Abi,
      data,
    });

    const [to, amount] = transferData.args;

    return {
      tokenAddress: args[0],
      to: to as Hex,
      amount: amount as bigint,
    };
  }
};

/**
 *  Save the UserOperation hash to the database
 */
const saveUserOpHash = async ({
  userOpHash,
  chainId,
}: {
  userOpHash: Hex;
  chainId: number;
}) => {
  // Save the UserOperation hash to the database
  await prisma.userOperation.create({
    data: {
      hash: userOpHash,
      chainId,
    },
  });
};

/**
 * Send a transfer to a stealth account.
 * Signed user operations should be provided.
 */
const send = async ({
  senderUserId,
  aggregationUserOps,
  finalTransferUserOp,
  relayQuotes,
  proxyStealthAccount,
}: {
  senderUserId: number;
  aggregationUserOps: UserOperation[];
  finalTransferUserOp: UserOperation;
  relayQuotes: RelayGetQuoteResponseBody[];
  proxyStealthAccount: StealthAddressWithEphemeral;
}) => {
  // Save the proxy stealth account to the database
  await handleNewStealthAccount({
    stealthAccount: proxyStealthAccount,
    userId: senderUserId,
  });

  const outputChainId = finalTransferUserOp.chainId;
  const proxAccountAddress = finalTransferUserOp.sender;
  const finalTransferData = getTransferDataFromUserOp(finalTransferUserOp);

  const tokenAddress = finalTransferData.tokenAddress;
  const recipient = finalTransferData.to;
  const transferAmount = finalTransferData.amount;

  console.log({
    outputChainId,
    proxAccountAddress,
    tokenAddress,
    recipient,
    transferAmount,
  });

  const userOpHashes = [];

  // Log the Relay request ids
  console.log(
    relayQuotes.map(quote => quote.steps.map(step => step.requestId))
  );

  for (const bridgeUserOp of aggregationUserOps) {
    console.log('Sending user operation (before bridge)', bridgeUserOp);
    const client = getPublicClient({
      chainId: bridgeUserOp.chainId,
    });

    const userOpHash = await sendUserOperation({
      client,
      userOp: bridgeUserOp,
    });

    await saveUserOpHash({
      userOpHash,
      chainId: outputChainId,
    });

    console.log('Sent user operation (before bridge):', userOpHash);
    userOpHashes.push(userOpHash);
    // Save the user operation hash to the database
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const proxyAccountTokenBalance = await getTokenBalance({
      address: proxAccountAddress,
      tokenAddress,
      chainId: outputChainId,
    });

    console.log(
      `Polling for proxy account token balance: ${proxyAccountTokenBalance}`
    );

    if (proxyAccountTokenBalance >= transferAmount) {
      await sleep(3000);
      break;
    }

    await sleep(3000);
  }

  const finalUserOpHash = await sendUserOperation({
    client: getPublicClient({
      chainId: outputChainId,
    }),
    userOp: finalTransferUserOp,
  });

  await saveUserOpHash({
    userOpHash: finalUserOpHash,
    chainId: outputChainId,
  });

  // 1. Save UserOperation hash
  // 2. The indexer will pick up the UserOperation hash and save the transaction and the related transfer traces
  // 3. Save the transfer

  console.log('Final user operation hash:', finalUserOpHash);
};

export default send;
