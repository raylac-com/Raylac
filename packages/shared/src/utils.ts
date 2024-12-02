import {
  Chain,
  decodeFunctionData,
  encodeFunctionData,
  encodeDeployData,
  getContractAddress,
  formatUnits,
  getAddress,
  Hex,
  toBytes,
  toHex,
  encodeAbiParameters,
  keccak256,
  hexToBigInt,
  parseAbiParameters,
} from 'viem';
import { ChainGasInfo, UserOperation } from './types';
import RaylacAccountV2Abi from './abi/RaylacAccountV2Abi';
import * as chains from 'viem/chains';
import { getAlchemyRpcUrl, getPublicClient } from './ethRpc';
import axios from 'axios';
import { ACCOUNT_FACTORY_V2_ADDRESS, ENTRY_POINT_ADDRESS } from './addresses';
import { ACCOUNT_IMPL_V2_ADDRESS } from './addresses';
import RaylacAccountProxyBytecode from './bytecode/RaylacAccountProxyBytecode';
import RaylacAccountProxyAbi from './abi/RaylacAccountProxyAbi';

const VIEW_TAG_BYTES = 1;
const CHAIN_ID_BYTES = 4;
const SCAN_FROM_BLOCK_BYTES = 4;

export const encodeERC5564Metadata = ({
  viewTag,
  chainInfo,
}: {
  viewTag: Hex;
  chainInfo: {
    chainId: number;
    scanFromBlock: bigint;
  }[];
}): Hex => {
  if (toBytes(viewTag).byteLength !== VIEW_TAG_BYTES) {
    throw new Error(
      `viewTag must be exactly 1 byte, got ${viewTag.length} hex chars`
    );
  }

  let metadata = viewTag;

  for (const chain of chainInfo) {
    metadata += toHex(chain.chainId, { size: CHAIN_ID_BYTES }).replace(
      '0x',
      ''
    );
    metadata += toHex(chain.scanFromBlock, {
      size: SCAN_FROM_BLOCK_BYTES,
    }).replace('0x', '');
  }

  return metadata;
};

/**
 * Concatenate paymaster address and authentication data
 */
export const encodePaymasterAndData = ({
  paymaster: paymasterAddress,
  data,
}: {
  paymaster: Hex;
  data: Hex;
}) => {
  const encoded = `${paymasterAddress.replace('0x', '')}${data.replace('0x', '')}`;
  return `0x${encoded}` as Hex;
};

/**
 * Get the arguments of the `execute` function of RaylacAccount.sol from `UserOperation.callData`
 */
export const decodeUserOpCalldata = (userOp: UserOperation) => {
  const { functionName, args } = decodeFunctionData({
    abi: RaylacAccountV2Abi,
    data: userOp.callData,
  });

  if (functionName !== 'execute') {
    throw new Error("Function name must be 'execute'");
  }

  const [to, value, data, tag] = args;

  return {
    to: getAddress(to),
    value,
    data,
    tag,
  };
};

/**
 * Returns viem's `Chain` object from a chain ID
 */
export const getChainFromId = (chainId: number): Chain => {
  const chain = Object.entries(chains).find(
    ([_, chain]) => chain.id === chainId
  );

  if (!chain) {
    throw new Error(`Chain with ID ${chainId} not found`);
  }

  return chain[1] as Chain;
};

export const formatAmount = (amount: string, decimals: number): string => {
  const formatted = Number(
    formatUnits(BigInt(amount), decimals)
  ).toLocaleString('en-US', {
    maximumFractionDigits: 6,
  });

  if (formatted === '0' && amount !== '0') {
    return '< 0';
  }

  return formatted;
};

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const increaseByPercent = ({
  value,
  percent,
}: {
  value: bigint;
  percent: number;
}): bigint => {
  const buff = (value * BigInt(percent)) / BigInt(100);
  return value + buff;
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

export const getSenderAddressV2 = ({
  singerAddress,
}: {
  singerAddress: Hex;
}) => {
  const accountImplAddress = ACCOUNT_IMPL_V2_ADDRESS;

  const accountAbi = RaylacAccountV2Abi;

  const factoryAddress = ACCOUNT_FACTORY_V2_ADDRESS;

  const data = encodeDeployData({
    abi: RaylacAccountProxyAbi,
    bytecode: RaylacAccountProxyBytecode,
    args: [
      accountImplAddress,
      encodeFunctionData({
        abi: accountAbi,
        functionName: 'initialize',
        args: [singerAddress],
      }),
    ],
  });

  const address = getContractAddress({
    bytecode: data,
    from: factoryAddress,
    opcode: 'CREATE2',
    salt: '0x0',
  });

  return address;
};

/**
 * Calls the `eth_maxPriorityFeePerGas` JSON-RPC method
 */
export const getMaxPriorityFeePerGas = async ({
  chainId,
}: {
  chainId: number;
}): Promise<bigint> => {
  const url = getAlchemyRpcUrl({ chain: getChainFromId(chainId) });

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
 * Get the gas info for all supported chains
 */
export const getGasInfo = async ({
  chainIds,
}: {
  chainIds: number[];
}): Promise<ChainGasInfo[]> => {
  const gasInfo: ChainGasInfo[] = [];
  for (const chainId of chainIds) {
    const client = getPublicClient({ chainId });
    const block = await client.getBlock({ blockTag: 'latest' });
    const maxPriorityFeePerGas = await getMaxPriorityFeePerGas({ chainId });

    if (block.baseFeePerGas === null) {
      throw new Error('baseFeePerGas is null');
    }

    gasInfo.push({
      chainId,
      baseFeePerGas: block.baseFeePerGas,
      maxPriorityFeePerGas,
    });
  }

  return gasInfo;
};

export const getChainName = (chainId: number) => {
  return `${getChainFromId(chainId).name} (${chainId})`;
};
