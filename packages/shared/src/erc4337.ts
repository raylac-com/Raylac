import {
  ACCOUNT_FACTORY_ADDRESS,
  ACCOUNT_FACTORY_V2_ADDRESS,
  ENTRY_POINT_ADDRESS,
  RAYLAC_PAYMASTER_ADDRESS,
} from './addresses';
import {
  ChainGasInfo,
  StealthAddressWithEphemeral,
  UserOperation,
} from './types';
import RaylacAccountAbi from './abi/RaylacAccountAbi';
import AccountFactoryAbi from './abi/AccountFactory';
import EntryPointAbi from './abi/EntryPointAbi';
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
import RaylacPaymasterAbi from './abi/RaylacPaymasterAbi';
import { getSenderAddress, recoveryStealthPrivKey } from './stealth';
import { increaseByPercent, sleep } from './utils';
import { signMessage } from 'viem/accounts';

/**
 * Get the init code for creating a stealth contract account
 */
export const getInitCode = ({
  stealthSigner,
  accountVersion = 2,
}: {
  stealthSigner: Hex;
  accountVersion?: 1 | 2;
}) => {
  const factoryAddress =
    accountVersion === 1 ? ACCOUNT_FACTORY_ADDRESS : ACCOUNT_FACTORY_V2_ADDRESS;

  const factoryData = encodeFunctionData({
    abi: AccountFactoryAbi,
    functionName: 'createAccount',
    args: [stealthSigner],
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
 * The sender of the operation is determined by the given stealthSigner.
 */
export const buildUserOp = ({
  chainId,
  stealthSigner,
  to,
  value,
  data,
  tag,
  gasInfo,
  nonce,
  accountVersion = 2,
}: {
  chainId: number;
  stealthSigner: Hex;
  to: Hex;
  value: bigint;
  data: Hex;
  tag: Hex;
  gasInfo: ChainGasInfo[];
  nonce: number | null;
  accountVersion?: 1 | 2;
}): UserOperation => {
  const chainGasInfo = gasInfo.find(gasInfo => gasInfo.chainId === chainId);

  if (!chainGasInfo) {
    throw new Error('Chain gas info not found');
  }

  const initCode = getInitCode({ stealthSigner, accountVersion });

  const senderAddress = getSenderAddress({
    stealthSigner,
  });

  if (!senderAddress) {
    throw new Error('Failed to get sender address');
  }

  const nextNonce = nonce === null ? 0 : Number(nonce) + 1;

  const callData = encodeFunctionData({
    abi: RaylacAccountAbi,
    functionName: 'execute',
    args: [to, value, data, tag],
  });

  const baseFeeBuffed = increaseByPercent({
    value: chainGasInfo.baseFeePerGas,
    percent: 10,
  });

  const maxPriorityFeePerGasBuffed = increaseByPercent({
    value: chainGasInfo.maxPriorityFeePerGas,
    percent: 20,
  });

  const maxFeePerGas = baseFeeBuffed + maxPriorityFeePerGasBuffed;

  const userOp: UserOperation = {
    sender: senderAddress,
    nonce: toHex(nextNonce),
    initCode: nonce === null ? initCode : '0x',
    callData,
    preVerificationGas: TRANSFER_OP_PRE_VERIFICATION_GAS,
    callGasLimit: TRANSFER_OP_CALL_GAS_LIMIT,
    // Use a higher gas limit for the verification step if the sender needs to be deployed
    verificationGasLimit:
      nonce === null
        ? TRANSFER_OP_INIT_VERIFICATION_GAS_LIMIT
        : TRANSFER_OP_VERIFICATION_GAS_LIMIT,
    maxFeePerGas: toHex(maxFeePerGas),
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGasBuffed),
    paymasterAndData: '0x',
    signature: '0x',
    chainId,
  };

  return userOp;
};

/**
 * Function that mirrors the `pack` function in https://github.com/eth-infinitism/account-abstraction/blob/v0.6.0/contracts/interfaces/UserOperation.sol
 */
const packUserOp = ({ userOp }: { userOp: UserOperation }) => {
  const hashInitCode = keccak256(userOp.initCode);
  const hashCallData = keccak256(userOp.callData);
  const hashPaymasterAndData = keccak256(userOp.paymasterAndData);

  return encodeAbiParameters(
    parseAbiParameters(
      'address sender, uint256 nonce, bytes32 hashInitCode, bytes32 hashCallData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes32 hashPaymasterAndData'
    ),
    [
      userOp.sender,
      hexToBigInt(userOp.nonce),
      hashInitCode,
      hashCallData,
      hexToBigInt(userOp.callGasLimit),
      hexToBigInt(userOp.verificationGasLimit),
      hexToBigInt(userOp.preVerificationGas),
      hexToBigInt(userOp.maxFeePerGas),
      hexToBigInt(userOp.maxPriorityFeePerGas),
      hashPaymasterAndData,
    ]
  );
};

export const getUserOpHash = ({ userOp }: { userOp: UserOperation }) => {
  const packedUserOp = packUserOp({ userOp });

  return keccak256(
    encodeAbiParameters(parseAbiParameters('bytes32, address, uint256'), [
      keccak256(packedUserOp),
      ENTRY_POINT_ADDRESS,
      BigInt(userOp.chainId),
    ])
  );
};

export const getUserOpHashAsync = async ({
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

/**
 * Function that mirrors the `pack` function in RaylacPaymaster.sol
 */
const packPaymasterSigMessage = ({ userOp }: { userOp: UserOperation }) => {
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
      RAYLAC_PAYMASTER_ADDRESS,
    ])
  );
};

export const getPaymasterMessageHashAsync = async ({
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
}): Promise<bigint> => {
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

/**
 * Sign a user operation with a stealth account
 */
export const signUserOpWithStealthAccount = async ({
  userOp,
  stealthAccount,
  spendingPrivKey,
  viewingPrivKey,
}: {
  userOp: UserOperation;
  stealthAccount: StealthAddressWithEphemeral;
  spendingPrivKey: Hex;
  viewingPrivKey: Hex;
}): Promise<UserOperation> => {
  const userOpHash = getUserOpHash({
    userOp,
  });

  const stealthPrivKey = recoveryStealthPrivKey({
    ephemeralPubKey: stealthAccount.ephemeralPubKey,
    spendingPrivKey: spendingPrivKey,
    viewingPrivKey: viewingPrivKey,
  });

  const sig = await signMessage({
    privateKey: stealthPrivKey,
    message: {
      raw: userOpHash,
    },
  });

  return {
    ...userOp,
    signature: sig,
  };
};

export const submitUserOpWithRetry = async ({
  signAndSubmitUserOp,
  userOp,
}: {
  signAndSubmitUserOp: (userOp: UserOperation) => Promise<Hex>;
  userOp: UserOperation;
}): Promise<Hex> => {
  const maxRetries = 5;

  let retries = 0;

  let currentMaxFeePerGas = hexToBigInt(userOp.maxFeePerGas);
  let currentMaxPriorityFeePerGas = hexToBigInt(userOp.maxPriorityFeePerGas);

  let errAfterRetries;
  while (retries < maxRetries) {
    try {
      userOp = {
        ...userOp,
        maxFeePerGas: toHex(currentMaxFeePerGas),
        maxPriorityFeePerGas: toHex(currentMaxPriorityFeePerGas),
      };

      const userOpHash = await signAndSubmitUserOp(userOp);

      return userOpHash;
    } catch (error: any) {
      if (error.message.includes('replacement transaction underpriced')) {
        // eslint-disable-next-line no-console
        console.log('Replacement underpriced, increasing gas prices');

        currentMaxFeePerGas = increaseByPercent({
          value: currentMaxFeePerGas,
          percent: 10,
        });

        currentMaxPriorityFeePerGas = increaseByPercent({
          value: currentMaxPriorityFeePerGas,
          percent: 10,
        });
      } else {
        // eslint-disable-next-line no-console
        console.log('Error sending user op:', error.message);
      }

      errAfterRetries = error;

      await sleep(1500);
      retries++;
    }
  }

  throw new Error(
    `Failed to submit user operation: ${errAfterRetries.message}`
  );
};
