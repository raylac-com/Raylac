import { concat, toBytes, toHex } from 'viem';
import { PackedUserOperation, UserOperation } from './types';

export const packUserOperation = (op: UserOperation): PackedUserOperation => {
  const accountGasLimits = new Uint8Array(32);

  accountGasLimits.set(
    toBytes(op.callGasLimit, {
      size: 16,
    }),
    0
  );

  accountGasLimits.set(
    toBytes(op.verificationGasLimit, {
      size: 16,
    }),
    16
  );

  const gasFees = new Uint8Array(32);

  gasFees.set(
    toBytes(op.maxFeePerGas, {
      size: 16,
    }),
    0
  );

  gasFees.set(
    toBytes(op.maxPriorityFeePerGas, {
      size: 16,
    }),
    16
  );

  return {
    sender: op.sender,
    nonce: op.nonce,
    initCode: op.initCode,
    callData: op.callData,
    accountGasLimits: toHex(accountGasLimits),
    preVerificationGas: op.preVerificationGas,
    gasFees: toHex(gasFees),
    paymasterAndData: op.paymasterAndData,
    signature: op.signature,
  };
};
