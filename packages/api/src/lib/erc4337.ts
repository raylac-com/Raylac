import {
  ACCOUNT_FACTORY_V2_ADDRESS,
  AccountFactoryV2Abi,
  ENTRY_POINT_ADDRESS,
  getSenderAddressV2,
  RAYLAC_PAYMASTER_V2_ADDRESS,
} from '@raylac/shared';
import { ChainGasInfo, UserOperation } from '@raylac/shared';
import { RaylacAccountV2Abi } from '@raylac/shared';
import { EntryPointAbi } from '@raylac/shared';
import {
  Chain,
  Hex,
  HttpTransport,
  PublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  hexToBigInt,
  keccak256,
  parseAbiParameters,
  toHex,
} from 'viem';
import axios from 'axios';
import { increaseByPercent } from '@raylac/shared';
import { getPublicClient } from '@raylac/shared';

/**
 * Get the init code for creating a stealth contract account
 */
export const getInitCode = ({ singerAddress }: { singerAddress: Hex }) => {
  const factoryAddress = ACCOUNT_FACTORY_V2_ADDRESS;

  const factoryData = encodeFunctionData({
    abi: AccountFactoryV2Abi,
    functionName: 'createAccount',
    args: [singerAddress],
  });

  const initCode = (factoryAddress + factoryData.slice(2)) as Hex;

  return initCode;
};

/** preVerificationGas for a transfer operation */
export const TRANSFER_OP_PRE_VERIFICATION_GAS = toHex(1_500_000);

/** callGasLimit for a transfer operation */
export const TRANSFER_OP_CALL_GAS_LIMIT = toHex(300_000);

/** verificationGasLimit for a transfer operation */
export const TRANSFER_OP_VERIFICATION_GAS_LIMIT = toHex(70_000);

/** verificationGasLimit for a transfer operation when the sender needs to be deployed */
export const TRANSFER_OP_INIT_VERIFICATION_GAS_LIMIT = toHex(210_000);

/**
 * Build an unsigned user operation.
 * The `sender` address of the user operation is derived from the given `singerAddress`.
 */
export const buildUserOp = ({
  chainId,
  singerAddress,
  to,
  value,
  data,
  gasInfo,
  nonce,
}: {
  chainId: number;
  singerAddress: Hex;
  to: Hex;
  value: bigint;
  data: Hex;
  gasInfo: ChainGasInfo;
  nonce: number;
}): UserOperation => {
  const initCode = getInitCode({ singerAddress });

  const senderAddress = getSenderAddressV2({
    singerAddress,
  });

  if (!senderAddress) {
    throw new Error('Failed to get sender address');
  }

  const callData = encodeFunctionData({
    abi: RaylacAccountV2Abi,
    functionName: 'execute',
    args: [to, value, data, '0x0'],
  });

  const baseFeeBuffed = increaseByPercent({
    value: gasInfo.baseFeePerGas,
    percent: 10,
  });

  const maxPriorityFeePerGasBuffed = increaseByPercent({
    value: gasInfo.maxPriorityFeePerGas,
    percent: 20,
  });

  const maxFeePerGas = baseFeeBuffed + maxPriorityFeePerGasBuffed;

  const userOp: UserOperation = {
    sender: senderAddress,
    nonce: toHex(nonce),
    initCode: nonce === 0 ? initCode : '0x',
    callData,
    preVerificationGas: toHex(1_500_000),
    callGasLimit: toHex(1_500_000),
    // Use a higher gas limit for the verification step if the sender needs to be deployed
    verificationGasLimit: toHex(1_500_000),
    maxFeePerGas: toHex(maxFeePerGas),
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGasBuffed),
    paymasterAndData: '0x',
    signature: '0x',
    chainId,
  };

  return userOp;
};

/**
 * Function that mirrors the `pack` function in RaylacPaymaster.sol
 */
export const packPaymasterSigMessage = ({
  userOp,
}: {
  userOp: UserOperation;
}) => {
  return encodeAbiParameters(
    parseAbiParameters(
      'address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas'
    ),
    [
      userOp.sender,
      hexToBigInt(userOp.nonce),
      userOp.initCode,
      userOp.callData,
      hexToBigInt(userOp.callGasLimit),
      hexToBigInt(userOp.verificationGasLimit),
      hexToBigInt(userOp.preVerificationGas),
      hexToBigInt(userOp.maxFeePerGas),
      hexToBigInt(userOp.maxPriorityFeePerGas),
    ]
  );
};

/**
 * Function that mirrors the `getHash` function in RaylacPaymaster.sol
 */
export const getPaymasterMessageHash = ({
  userOp,
}: {
  userOp: UserOperation;
}) => {
  const packedPaymasterSigMessage = packPaymasterSigMessage({ userOp });

  return keccak256(
    encodeAbiParameters(parseAbiParameters('bytes, uint256, address'), [
      packedPaymasterSigMessage,
      BigInt(userOp.chainId),
      RAYLAC_PAYMASTER_V2_ADDRESS,
    ])
  );
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
 * Calls the `eth_maxPriorityFeePerGas` JSON-RPC method
 */
export const getMaxPriorityFeePerGas = async ({
  chainId,
}: {
  chainId: number;
}): Promise<bigint> => {
  const url = getPublicClient({ chainId }).transport.url as string;

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
    url,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_maxPriorityFeePerGas',
      params: [],
    },
    config
  );

  if (result.data.error) {
    throw new Error(JSON.stringify(result.data.error));
  }

  return BigInt(result.data.result!);
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

export const getAccountNonce = async ({
  chainId,
  address,
}: {
  chainId: number;
  address: Hex;
}) => {
  const client = getPublicClient({ chainId });

  const nonce = await client.readContract({
    address: ENTRY_POINT_ADDRESS,
    abi: EntryPointAbi,
    functionName: 'getNonce',
    args: [address, BigInt(0)],
  });

  return nonce;
};
