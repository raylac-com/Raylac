import {
  RAYLAC_PAYMASTER_V2_ADDRESS,
  UserOperation,
  encodePaymasterAndData,
} from '@raylac/shared';
import { signMessage } from 'viem/accounts';
import { PAYMASTER_PRIVATE_KEY } from './envVars';
import { getPaymasterMessageHash } from './erc4337';

/**
 * Sign a user operation with the paymaster's private key
 */
export const paymasterSignUserOp = async (
  userOp: UserOperation
): Promise<UserOperation> => {
  const userOpHash = getPaymasterMessageHash({
    userOp,
  });

  const signature = await signMessage({
    privateKey: PAYMASTER_PRIVATE_KEY,
    message: {
      raw: userOpHash,
    },
  });

  return {
    ...userOp,
    paymasterAndData: encodePaymasterAndData({
      paymaster: RAYLAC_PAYMASTER_V2_ADDRESS,
      data: signature,
    }),
  };
};
