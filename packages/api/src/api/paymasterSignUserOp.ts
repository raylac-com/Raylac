import {
  TRANSFER_OP_CALL_GAS_LIMIT,
  TRANSFER_OP_INIT_VERIFICATION_GAS_LIMIT,
  TRANSFER_OP_PRE_VERIFICATION_GAS,
  TRANSFER_OP_VERIFICATION_GAS_LIMIT,
  UserOperation,
  getPaymasterMessageHash,
} from '@raylac/shared';
import { signMessage } from 'viem/accounts';
import { Hex, parseGwei, toHex } from 'viem';
import logger from '../lib/logger';

const PAYMASTER_PRIVATE_KEY = process.env.PAYMASTER_PRIVATE_KEY;

if (!PAYMASTER_PRIVATE_KEY) {
  throw new Error('PAYMASTER_PRIVATE_KEY not set');
}

/** Max fee (base + priority) that the paymaster will accept */
const maxFee = parseGwei('0.01');

/**
 * Check that a user operation has values as expected.
 * Throws an error if it does not.
 */
const validateUserOp = (userOp: UserOperation) => {
  if (userOp.callGasLimit !== TRANSFER_OP_CALL_GAS_LIMIT) {
    throw new Error('Invalid callGasLimit');
  }

  if (
    userOp.initCode !== '0x' &&
    userOp.verificationGasLimit !== TRANSFER_OP_INIT_VERIFICATION_GAS_LIMIT
  ) {
    throw new Error(`Invalid verificationGasLimit for initCode !== 0`);
  }

  if (
    userOp.initCode === '0x' &&
    userOp.verificationGasLimit !== TRANSFER_OP_VERIFICATION_GAS_LIMIT
  ) {
    throw new Error(`Invalid verificationGasLimit for initCode === 0`);
  }

  if (userOp.preVerificationGas !== TRANSFER_OP_PRE_VERIFICATION_GAS) {
    throw new Error('Invalid preVerificationGas');
  }

  if (userOp.verificationGasLimit !== TRANSFER_OP_VERIFICATION_GAS_LIMIT) {
    throw new Error('Invalid verificationGasLimit');
  }

  logger.info('userOp.maxFeePerGas : maxFee', userOp.maxFeePerGas, maxFee);

  if (userOp.maxFeePerGas > toHex(maxFee)) {
    throw new Error('maxFeePerGas exceeds maxFee');
  }
};

/**
 * Sign a user operation with the paymaster's private key
 */
const paymasterSignUserOp = async (userOp: UserOperation): Promise<Hex> => {
  // Verify that user operations have values as expected
  validateUserOp(userOp);

  const userOpHash = getPaymasterMessageHash({
    userOp,
  });

  const signature = await signMessage({
    privateKey: PAYMASTER_PRIVATE_KEY as Hex,
    message: {
      raw: userOpHash,
    },
  });

  return signature;
};

export default paymasterSignUserOp;
