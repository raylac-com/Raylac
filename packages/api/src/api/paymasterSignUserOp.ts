import {
  TRANSFER_OP_CALL_GAS_LIMIT,
  TRANSFER_OP_INIT_VERIFICATION_GAS_LIMIT,
  TRANSFER_OP_PRE_VERIFICATION_GAS,
  TRANSFER_OP_VERIFICATION_GAS_LIMIT,
  UserOperation,
  getPaymasterMessageHash,
} from '@raylac/shared';
import { signMessage } from 'viem/accounts';
import { Hex, parseGwei } from 'viem';

const PAYMASTER_PRIVATE_KEY = process.env.PAYMASTER_PRIVATE_KEY;

if (!PAYMASTER_PRIVATE_KEY) {
  throw new Error('PAYMASTER_PRIVATE_KEY not set');
}

/** Max fee (base + priority) that the paymaster will accept */
const maxFee = parseGwei('0.05');

/**
 * Check that a user operation has values as expected.
 * Throws an error if it does not.
 */
const validateUserOp = (userOp: UserOperation) => {
  if (userOp.callGasLimit !== TRANSFER_OP_CALL_GAS_LIMIT) {
    throw new Error(
      `Invalid callGasLimit ${userOp.callGasLimit}. Expected ${TRANSFER_OP_CALL_GAS_LIMIT}`
    );
  }

  if (
    userOp.initCode !== '0x' &&
    userOp.verificationGasLimit !== TRANSFER_OP_INIT_VERIFICATION_GAS_LIMIT
  ) {
    throw new Error(
      `Invalid verificationGasLimit ${userOp.verificationGasLimit}. Expected ${TRANSFER_OP_INIT_VERIFICATION_GAS_LIMIT} for initCode !== 0`
    );
  }

  if (
    userOp.initCode === '0x' &&
    userOp.verificationGasLimit !== TRANSFER_OP_VERIFICATION_GAS_LIMIT
  ) {
    throw new Error(
      `Invalid verificationGasLimit ${userOp.verificationGasLimit}. Expected ${TRANSFER_OP_VERIFICATION_GAS_LIMIT} for initCode === 0`
    );
  }

  if (userOp.preVerificationGas !== TRANSFER_OP_PRE_VERIFICATION_GAS) {
    throw new Error(
      `Invalid preVerificationGas ${userOp.preVerificationGas}. Expected ${TRANSFER_OP_PRE_VERIFICATION_GAS}`
    );
  }

  if (userOp.callGasLimit !== TRANSFER_OP_CALL_GAS_LIMIT) {
    throw new Error(
      `Invalid callGasLimit ${userOp.callGasLimit}. Expected ${TRANSFER_OP_CALL_GAS_LIMIT}`
    );
  }

  if (BigInt(userOp.maxFeePerGas) > maxFee) {
    throw new Error(
      `maxFeePerGas exceeds maxFee ${BigInt(userOp.maxFeePerGas)} > ${maxFee}`
    );
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
