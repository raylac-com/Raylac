import {
  RelaySwapMultiInputRequestBody,
  RelayGetQuoteResponseBody,
  getGasInfo,
  getSenderAddressV2,
  BuildSwapUserOpRequestBody,
} from '@raylac/shared';
import { ed, st } from '@raylac/shared-backend';
import { relayApi } from '../lib/relay';
import { buildUserOp, getAccountNonce } from '../lib/erc4337';
import { paymasterSignUserOp } from '../lib/paymaster';

const buildSwapUserOp = async ({
  singerAddress,
  swapInput,
  swapOutput,
}: BuildSwapUserOpRequestBody) => {
  // Get quote from Relay
  const senderAddress = getSenderAddressV2({
    singerAddress,
  });

  const requestBody: RelaySwapMultiInputRequestBody = {
    user: senderAddress,
    recipient: senderAddress,
    origins: swapInput.map(origin => ({
      chainId: origin.chainId,
      currency: origin.tokenAddress,
      amount: origin.amount.toString(),
    })),
    destinationCurrency: swapOutput.tokenAddress,
    destinationChainId: swapOutput.chainId,
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
    for (const [i, item] of step.items.entries()) {
      const nonce = await getAccountNonce({
        chainId: item.data.chainId,
        address: senderAddress,
      });

      const gasInfo = await getGasInfo({
        chainIds: [item.data.chainId],
      });

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
