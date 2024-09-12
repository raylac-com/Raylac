import {
  ACCOUNT_FACTORY_ADDRESS,
  ENTRY_POINT_ADDRESS,
  RAYLAC_PAYMASTER_ADDRESS,
} from './addresses';
import { UserOperation } from './types';
import RaylacAccountAbi from './abi/RaylacAccountAbi';
import AccountFactoryAbi from './abi/AccountFactory';
import EntryPointAbi from './abi/EntryPointAbi';
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
  toHex,
  zeroAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import axios from 'axios';
import RaylacPaymasterAbi from './abi/RaylacPaymasterAbi';
import { getSenderAddress } from './stealth';

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

  const senderAddress = getSenderAddress({
    stealthSigner,
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
    abi: RaylacAccountAbi,
    functionName: 'execute',
    args: [to, value, data],
  });

  const senderCode = await client.getCode({
    address: senderAddress,
  });

  const gasPrice = await client.getGasPrice();
  const gasPriceBuffer = (gasPrice * BigInt(20)) / BigInt(100);
  const maxFeePerGas = gasPrice + gasPriceBuffer;
  const maxPriorityFeePerGas = await rundlerMaxPriorityFeePerGas({ client });

  const userOp: UserOperation = {
    sender: senderAddress,
    nonce: toHex(nonce),
    initCode: senderCode ? '0x' : initCode,
    callData,
    callGasLimit: toHex(BigInt(0)),
    verificationGasLimit: toHex(BigInt(0)),
    preVerificationGas: toHex(BigInt(0)),
    maxFeePerGas: toHex(maxFeePerGas),
    maxPriorityFeePerGas,
    paymasterAndData: '0x',
    // Dummy signature as specified by Alchemy https://docs.alchemy.com/reference/eth-estimateuseroperationgas
    signature:
      '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c',
  };

  const gasEstimation = await estimateUserOperationGas({
    client,
    userOp,
  });

  userOp.callGasLimit = gasEstimation.callGasLimit;
  userOp.verificationGasLimit = gasEstimation.verificationGasLimit;
  userOp.preVerificationGas = gasEstimation.preVerificationGas;

  console.log('User operation:', userOp);

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
    abi: RaylacPaymasterAbi,
    address: RAYLAC_PAYMASTER_ADDRESS,
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

  return paymasterMessageHash as Hex;
};

/*
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
*/

export const estimateUserOperationGas = async ({
  client,
  userOp,
}: {
  client: PublicClient<HttpTransport, Chain>;
  userOp: UserOperation;
}) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post<{
    result?: {
      preVerificationGas: Hex;
      verificationGasLimit: Hex;
      callGasLimit: Hex;
      paymasterVerificationGasLimit: Hex;
    };
    error?: {
      code: number;
      message: string;
    };
  }>(
    client.transport.url as string,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_estimateUserOperationGas',
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
 * Calls Alchemy's `eth_sendUserOperation` JSON-RPC method
 * https://docs.alchemy.com/reference/rundler-maxpriorityfeepergas
 */
export const rundlerMaxPriorityFeePerGas = async ({
  client,
}: {
  client: PublicClient<HttpTransport, Chain>;
}) => {
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
    client.transport.url as string,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'rundler_maxPriorityFeePerGas',
      params: [],
    },
    config
  );

  if (result.data.error) {
    throw new Error(JSON.stringify(result.data.error));
  }

  return result.data.result!;
};

/**
 * Send a user operation to the Alchemy bundler.
 * Calls the `eth_sendUserOperation` JSON-RPC method
 * @returns user operation hash
 */
export const sendUserOperation = async ({
  client,
  userOp,
}: {
  client: PublicClient<HttpTransport, Chain>;
  userOp: UserOperation;
}): Promise<Hex> => {
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
    client.transport.url as string,
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
export const getUserOpByHash = async ({
  client,
  hash,
}: {
  client: PublicClient<HttpTransport, Chain>;
  hash: Hex;
}) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post(
    client.transport.url as string,
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

export const getUserOpReceipt = async ({
  client,
  hash,
}: {
  client: PublicClient<HttpTransport, Chain>;
  hash: Hex;
}) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post<{
    result?: any;
    error?: {
      code: number;
      message: string;
    };
  }>(
    client.transport.url as string,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_getUserOperationReceipt',
      params: [hash],
    },
    config
  );

  if (result.data.error) {
    throw new Error(JSON.stringify(result.data.error));
  }

  return result.data!;
};
