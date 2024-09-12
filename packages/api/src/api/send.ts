import { UserOperation, sendUserOperation } from '@raylac/shared';
import { publicClient } from '../lib/viem';

/**
 * Send a transfer to a stealth account.
 * Signed user operations should be provided.
 */
const send = async ({ userOps }: { userOps: UserOperation[] }) => {
  const userOpHashes = [];

  for (const userOp of userOps) {
    console.log('Sending user operation', userOp);
    const userOpHash = await sendUserOperation({
      client: publicClient,
      userOp,
    });
    console.log('Sent user operations', userOpHash);
    userOpHashes.push(userOpHash);
  }
};

export default send;
