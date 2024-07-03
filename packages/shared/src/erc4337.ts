import {
  ACCOUNT_FACTORY_ADDRESS,
  ENTRY_POINT_ADDRESS,
  SUTORI_PAYMASTER_ADDRESS,
} from './addresses';
import { UserOperation } from './types';
import SutoriAccountAbi from './abi/SutoriAccount';
import AccountFactoryAbi from './abi/AccountFactory';
import EntryPointAbi from './abi/EntryPoint';
import {
  BaseError,
  Chain,
  ContractFunctionRevertedError,
  Hex,
  HttpTransport,
  PublicClient,
  encodeFunctionData,
  hexToBigInt,
  pad,
  parseEther,
  toHex,
  zeroAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import axios from 'axios';
import SutoriPaymasterAbi from './abi/SutoriPaymaster';
import { getChain, getEthRpcUrl } from './ethRpc';

const chain = getChain();
const ethRpcUrl = getEthRpcUrl(chain);

/**
 * Get the init code for creating a stealth contract account
 */
export const getInitCode = ({ stealthSigner }: { stealthSigner: Hex }) => {
  const factoryData = encodeFunctionData({
    abi: AccountFactoryAbi,
    functionName: 'createAccount',
    args: [stealthSigner],
  });

  const initCode = (ACCOUNT_FACTORY_ADDRESS + factoryData.slice(2)) as Hex;

  return initCode;
};

/**
 * Build an unsigned user operation.
 * The sender of the operation is determined by the given stealthSigner.
 */
export const buildUserOp = async ({
  client,
  stealthSigner,
  to,
  value,
  data,
}: {
  client: PublicClient<HttpTransport, Chain>;
  stealthSigner: Hex;
  to: Hex;
  value: bigint;
  data: Hex;
}) => {
  const initCode = getInitCode({ stealthSigner });

  const senderAddress = await getSenderAddress({
    client,
    initCode,
  });

  if (!senderAddress) {
    throw new Error('Failed to get sender address');
  }

  const nonce = await client.readContract({
    address: ENTRY_POINT_ADDRESS,
    abi: EntryPointAbi,
    functionName: 'getNonce',
    args: [senderAddress, BigInt(0)],
  });

  const callData = encodeFunctionData({
    abi: SutoriAccountAbi,
    functionName: 'execute',
    args: [to, value, data],
  });

  const senderCode = await client.getCode({
    address: senderAddress,
  });

  const userOp: UserOperation = {
    sender: senderAddress,
    nonce: toHex(nonce),
    initCode: senderCode ? '0x' : initCode,
    callData,
    callGasLimit: toHex(BigInt(100_000)),
    verificationGasLimit: toHex(BigInt(400_000)),
    preVerificationGas: toHex(BigInt(90000)),
    maxFeePerGas: toHex(parseEther('0.00000001')),
    maxPriorityFeePerGas: toHex(BigInt(1562500000)),
    paymasterAndData: '0x',
    signature: '0x',
  };

  return userOp;
};

export const getUserOpHash = async ({
  client,
  userOp,
}: {
  client: PublicClient;
  userOp: UserOperation;
}) => {
  const userOpHash = await client.readContract({
    address: ENTRY_POINT_ADDRESS,
    abi: EntryPointAbi,
    functionName: 'getUserOpHash',
    args: [
      {
        sender: userOp.sender,
        nonce: hexToBigInt(userOp.nonce),
        initCode: userOp.initCode,
        callData: userOp.callData,
        callGasLimit: hexToBigInt(userOp.callGasLimit),
        verificationGasLimit: hexToBigInt(userOp.verificationGasLimit),
        preVerificationGas: hexToBigInt(userOp.preVerificationGas),
        maxFeePerGas: hexToBigInt(userOp.maxFeePerGas),
        maxPriorityFeePerGas: hexToBigInt(userOp.maxPriorityFeePerGas),
        paymasterAndData: userOp.paymasterAndData,
        signature: userOp.signature,
      },
    ],
  });

  return userOpHash;
};

export const getPaymasterMessageHash = async ({
  userOp,
  client,
}: {
  userOp: UserOperation;
  client: PublicClient<HttpTransport, Chain>;
}) => {
  const paymasterMessageHash = await client.readContract({
    abi: SutoriPaymasterAbi,
    address: SUTORI_PAYMASTER_ADDRESS,
    functionName: 'getHash',
    args: [
      {
        sender: userOp.sender,
        nonce: hexToBigInt(userOp.nonce),
        initCode: userOp.initCode,
        callData: userOp.callData,
        callGasLimit: hexToBigInt(userOp.callGasLimit),
        verificationGasLimit: hexToBigInt(userOp.verificationGasLimit),
        preVerificationGas: hexToBigInt(userOp.preVerificationGas),
        maxFeePerGas: hexToBigInt(userOp.maxFeePerGas),
        maxPriorityFeePerGas: hexToBigInt(userOp.maxPriorityFeePerGas),
        paymasterAndData: userOp.paymasterAndData,
        signature: userOp.signature,
      },
    ],
  });

  return paymasterMessageHash;
};

export const getSenderAddress = async ({
  client,
  initCode,
}: {
  client: PublicClient<HttpTransport, Chain>;
  initCode: Hex;
}): Promise<Hex | undefined> => {
  try {
    // Simulate contract call from a random account
    const account = await privateKeyToAccount(pad('0x1'));

    await client.simulateContract({
      address: ENTRY_POINT_ADDRESS,
      account,
      abi: EntryPointAbi,
      functionName: 'getSenderAddress',
      args: [initCode],
    });
  } catch (err: any) {
    if (err instanceof BaseError) {
      const revertError = err.walk(
        err => err instanceof ContractFunctionRevertedError
      );
      if (revertError instanceof ContractFunctionRevertedError) {
        const errorName = revertError.data?.errorName ?? '';
        if (errorName === 'SenderAddressResult') {
          if (revertError.data?.args?.length !== 1) {
            throw new Error(
              'Unexpected number of arguments in SenderAddressResult'
            );
          }

          const senderAddress = revertError.data.args[0] as Hex;

          if (senderAddress == zeroAddress) {
            throw new Error('Sender address is zero');
          }

          return senderAddress;
        }
      }
    }

    throw err;
  }
};

/**
 * Send a user operation to the Alchemy bundler.
 * Calls the `eth_sendUserOperation` JSON-RPC method
 * @returns user operation hash
 */
export const sendUserOperation = async (
  userOp: UserOperation
): Promise<Hex> => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post<{
    result?: Hex;
    error?: {
      code: number;
      message: string;
    };
  }>(
    ethRpcUrl,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_sendUserOperation',
      params: [userOp, ENTRY_POINT_ADDRESS],
    },
    config
  );

  if (result.data.error) {
    throw new Error(JSON.stringify(result.data.error));
  }

  return result.data.result!;
};

/**
 * Get a user operation by its hash.
 * Calls the `eth_getUserOperationByHash` JSON-RPC method
 */
export const getUserOpByHash = async (hash: Hex) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post(
    ethRpcUrl,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_getUserOperationByHash',
      params: [hash],
    },
    config
  );

  return result.data;
};
