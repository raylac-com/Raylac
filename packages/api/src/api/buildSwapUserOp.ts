import {
  getGasInfo,
  getSenderAddressV2,
  BuildSwapUserOpRequestBody,
} from '@raylac/shared';
import { buildUserOp, getAccountNonce } from '../lib/erc4337';
import { paymasterSignUserOp } from '../lib/paymaster';

const buildSwapUserOp = async ({
  singerAddress,
  quote,
}: BuildSwapUserOpRequestBody) => {
  // Get quote from Relay
  const senderAddress = getSenderAddressV2({
    singerAddress,
  });

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
