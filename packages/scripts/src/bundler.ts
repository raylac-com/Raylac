import 'dotenv/config';
import { ENTRY_POINT_ADDRESS, UserOperation } from '@sutori/shared';
import axios from 'axios';
import { Hex, toHex } from 'viem';

const ALCHEMY_BASE_SEPOLIA_API_KEY = process.env.ALCHEMY_BASE_SEPOLIA_API_KEY;

if (!ALCHEMY_BASE_SEPOLIA_API_KEY) {
  throw new Error('ALCHEMY_BASE_SEPOLIA_API_KEY is not set');
}

interface AlchemyUserOp {
  sender: Hex;
  nonce: Hex;
  initCode: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  paymasterAndData: Hex;
  signature: Hex;
}

const toAlchemyUserOp = (userOp: UserOperation): AlchemyUserOp => {
  return {
    sender: userOp.sender,
    nonce: toHex(userOp.nonce),
    initCode: userOp.initCode,
    callData: userOp.callData,
    callGasLimit: toHex(userOp.callGasLimit),
    verificationGasLimit: toHex(userOp.verificationGasLimit),
    preVerificationGas: toHex(userOp.preVerificationGas),
    maxFeePerGas: toHex(userOp.maxFeePerGas),
    maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas),
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature,
  };
};

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const sendUserOps = async (userOps: UserOperation[]) => {
  for (const userOp of userOps) {
    const config = {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    };

    const alchemyUserOp = toAlchemyUserOp(userOp);

    const result = await axios.post(
      `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_BASE_SEPOLIA_API_KEY}`,
      {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendUserOperation',
        params: [alchemyUserOp, ENTRY_POINT_ADDRESS],
      },
      config
    );

    console.log('Result', result.data);
  }
};

export const estimateUserOpGas = async (userOp: UserOperation) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const alchemyUserOp = toAlchemyUserOp(userOp);

  const result = await axios.post(
    `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_BASE_SEPOLIA_API_KEY}`,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_estimateUserOperationGas',
      params: [alchemyUserOp, ENTRY_POINT_ADDRESS],
    },
    config
  );

  return result.data;
}

export const getUserOpByHash = async (hash: Hex) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post(
    `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_BASE_SEPOLIA_API_KEY}`,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_getUserOperationByHash',
      params: [hash],
    },
    config
  );

  return result.data;
}