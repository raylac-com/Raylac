import {
  RelaySwapMultiInputRequestBody,
  RelayGetQuoteResponseBody,
  getGasInfo,
  getSenderAddressV2,
} from '@raylac/shared';
import { ed, st } from '@raylac/shared-backend';
import { Hex, hexToBigInt } from 'viem';
import { relayApi } from '../lib/relay';
import { buildUserOp, getAccountNonce } from '../lib/erc4337';
import { paymasterSignUserOp } from '../lib/paymaster';

const buildSwapUserOp = async ({
  singerAddress,
  origins,
  recipient,
  destinationChainId,
  destinationTokenAddress,
}: {
  singerAddress: Hex;
  origins: {
    chainId: number;
    tokenAddress: Hex;
    amount: Hex;
  }[];
  recipient: Hex;
  destinationChainId: number;
  destinationTokenAddress: Hex;
}) => {
  // Get quote from Relay
  const senderAddress = getSenderAddressV2({
    singerAddress,
  });

  const requestBody: RelaySwapMultiInputRequestBody = {
    user: senderAddress,
    recipient,
    origins: origins.map(origin => ({
      chainId: origin.chainId,
      currency: origin.tokenAddress,
      amount: hexToBigInt(origin.amount).toString(),
    })),
    destinationCurrency: destinationTokenAddress,
    destinationChainId,
    partial: true,
    tradeType: 'EXACT_INPUT',
    useUserOperation: true,
  };

  const qt = st('Get quote');

  const { data: quote } = await relayApi.post<RelayGetQuoteResponseBody>(
    '/execute/swap/multi-input',
    requestBody
  );

  ed(qt);

  // Build user op

  // Get the nonce of the account

  const unsignedUserOps = [];

  for (const step of quote.steps) {
    const nonce = await getAccountNonce({
      chainId: destinationChainId,
      address: senderAddress,
    });

    const gasInfo = await getGasInfo({
      chainIds: [step.items[0].data.chainId],
    });

    for (const [i, item] of step.items.entries()) {
      const userOp = buildUserOp({
        to: item.data.to,
        data: item.data.data,
        value: BigInt(item.data.value),
        chainId: item.data.chainId,
        singerAddress,
        gasInfo: gasInfo[0],
        nonce: Number(nonce + BigInt(i)),
      });

      unsignedUserOps.push(userOp);
    }
  }

  // Attach paymaster signatures to all user ops

  const signedUserOps = await Promise.all(
    unsignedUserOps.map(userOp => paymasterSignUserOp(userOp))
  );

  return signedUserOps;
};

export default buildSwapUserOp;
