import { UserOperation, getPaymasterMessageHash } from '@raylac/shared';
import { signMessage } from 'viem/accounts';
import { Hex } from 'viem';
import { publicClient } from './viem';

const PAYMASTER_PRIVATE_KEY = process.env.PAYMASTER_PRIVATE_KEY;

if (!PAYMASTER_PRIVATE_KEY) {
  throw new Error('PAYMASTER_PRIVATE_KEY not set');
}

/**
 * Sign a user operation with the paymaster's private key
 */
export const signUserOp = async (userOp: UserOperation): Promise<Hex> => {
  const userOpHash = await getPaymasterMessageHash({
    client: publicClient,
    userOp,
  });

  console.log('Signing user op', userOp);
  console.log('paymaster user op hash:', userOpHash);

  const signature = await signMessage({
    privateKey: PAYMASTER_PRIVATE_KEY as Hex,
    message: {
      raw: userOpHash,
    },
  });

  return signature;
};
