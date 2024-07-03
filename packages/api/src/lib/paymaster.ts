import {
  UserOperation,
  getPaymasterMessageHash,
  getPublicClient,
} from '@sutori/shared';
import { privateKeyToAccount, signMessage } from 'viem/accounts';
import { Hex } from 'viem';

const PAYMASTER_PRIVATE_KEY = process.env.PAYMASTER_PRIVATE_KEY;

if (!PAYMASTER_PRIVATE_KEY) {
  throw new Error('PAYMASTER_PRIVATE_KEY not set');
}

const client = getPublicClient();

export const signUserOp = async (userOp: UserOperation): Promise<Hex> => {
  const userOpHash = await getPaymasterMessageHash({
    client,
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

  const account = privateKeyToAccount(PAYMASTER_PRIVATE_KEY as Hex);
  console.log('Account:', account.address);

  return signature;
};
