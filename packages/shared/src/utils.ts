import * as secp from '@noble/secp256k1';
import {
  Chain,
  decodeFunctionData,
  formatUnits,
  fromHex,
  getAddress,
  Hex,
  keccak256,
  pad,
  parseUnits,
  toBytes,
  toHex,
} from 'viem';
import {
  AnvilBlockTraceResponse,
  BlockTraceResponse,
  BlockTransactionResponse,
  ChainGasInfo,
  DecodedUserOperationContext,
  TraceWithTraceAddress,
  UserActionType,
  UserOperation,
} from './types';
import RaylacAccountV2Abi from './abi/RaylacAccountV2Abi';
import ERC20Abi from './abi/ERC20Abi';
import * as chains from 'viem/chains';
import { supportedTokens, NATIVE_TOKEN_ADDRESS } from './supportedTokens';
import { getPublicClient } from './ethRpc';
import {
  devChains,
  getERC20TokenBalance,
  getMaxPriorityFeePerGas,
  supportedChains,
  traceBlockByNumber,
} from '.';
import axios from 'axios';

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

export const decodeERC5564MetadataAsViewTag = (metadata: Hex) => {
  const metadataBytes = toBytes(metadata);
  const viewTag = toHex(metadataBytes.slice(0, VIEW_TAG_BYTES));

  const chainInfos: {
    chainId: number;
    scanFromBlock: bigint;
  }[] = [];

  const supportedChainIds = supportedChains.map(chain => chain.id);

  for (
    let i = VIEW_TAG_BYTES;
    i < metadataBytes.byteLength;
    i += CHAIN_ID_BYTES + SCAN_FROM_BLOCK_BYTES
  ) {
    const chainId = fromHex(
      toHex(metadataBytes.slice(i, i + CHAIN_ID_BYTES)),
      'number'
    );

    // Ignore scan requests for unsupported chains
    if (!supportedChainIds.includes(chainId)) {
      continue;
    }

    const scanFromBlock = fromHex(
      toHex(
        metadataBytes.slice(
          i + CHAIN_ID_BYTES,
          i + CHAIN_ID_BYTES + SCAN_FROM_BLOCK_BYTES
        )
      ),
      'bigint'
    );

    chainInfos.push({ chainId, scanFromBlock });
  }

  return { viewTag, chainInfos };
};

export const hexToProjectivePoint = (hex: Hex) => {
  return secp.ProjectivePoint.fromHex(hex.replace('0x', ''));
};

export const projectivePointToHex = (point: secp.ProjectivePoint) => {
  return `0x${point.toHex(false)}` as Hex;
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

export const STEALTH_UNITS = [
  parseUnits('1000', 6),
  parseUnits('500', 6),
  parseUnits('100', 6),
  parseUnits('50', 6),
  parseUnits('10', 6),
  parseUnits('5', 6),
  parseUnits('1', 6),
];

export const splitToUnits = ({
  amount,
}: {
  amount: bigint;
  decimals: number;
}) => {
  const result: {
    [key: string]: number;
  } = STEALTH_UNITS.reduce((acc, unit) => {
    const count = amount / unit;
    amount -= BigInt(count * unit);
    return {
      ...acc,
      [unit.toString()]: Number(count),
    };
  }, {});

  return result;
};

export const getRandomBigInt = ({
  min,
  max,
}: {
  min: bigint;
  max: bigint;
}): bigint => {
  const range = max - min + 1n; // Calculate the range
  const randomValue = BigInt(Math.floor(Math.random() * Number(range))); // Generate a random number in range
  return min + randomValue;
};

const mimeTypes: {
  [key: string]: string;
} = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'text/html': 'html',
  'text/css': 'css',
  'text/javascript': 'js',
  'application/json': 'json',
  'application/zip': 'zip',
  'audio/mpeg': 'mp3',
  'video/mp4': 'mp4',
};

export const mimeTypeToExtension = (mimeType: string) => {
  // eslint-disable-next-line security/detect-object-injection
  const extension = mimeTypes[mimeType];
  if (!extension) {
    throw new Error(`Unknown MIME type: ${mimeType}`);
  }

  return extension;
};

/**
 * Get ERC20 token transfer data from a user operation
 */
export const getERC20TransferDataFromUserOp = (userOp: UserOperation) => {
  const { functionName, args } = decodeFunctionData({
    abi: RaylacAccountV2Abi,
    data: userOp.callData,
  });

  if (functionName !== 'execute') {
    throw new Error("Function name must be 'execute'");
  }

  const transferData = decodeFunctionData({
    abi: ERC20Abi,
    data: args[2],
  });

  const [to, amount] = transferData.args;
  return {
    to: to as Hex,
    amount: amount as bigint,
  };
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
 * Decode the `tag` argument in the `execute` function of RaylacAccount.sol
 */
export const decodeUserOperationContext = ({
  txHash,
  context,
}: {
  txHash: Hex;
  context: Hex;
}): DecodedUserOperationContext => {
  try {
    const contextRaw = context.replace('0x', '');
    // The first 32 bytes are the grouping tag
    const multiChainTag = `0x${contextRaw.slice(0, 64)}` as Hex;

    // The last 2 bytes are the group size
    const numChains = fromHex(`0x${contextRaw.slice(64, 68)}`, 'number');

    return { multiChainTag, numChains };
  } catch (_err: any) {
    // If we fail to decode the context,
    // just use the tx hash as the multi chain tag
    // and assume this UserAction only spans one chain
    return { multiChainTag: txHash, numChains: 1 };
  }
};

/**
 * Returns viem's `Chain` object from a chain ID
 */
export const getChainFromId = (chainId: number): Chain => {
  const chain = Object.entries([...Object.values(chains), ...devChains]).find(
    ([_, chain]) => chain.id === chainId
  );

  if (!chain) {
    throw new Error(`Chain with ID ${chainId} not found`);
  }

  return chain[1] as Chain;
};

/**
 * Get the address of a token on a chain.
 */
export const getTokenAddressOnChain = ({
  chainId,
  tokenId,
}: {
  chainId: number;
  tokenId: string;
}) => {
  const tokenMetadata = supportedTokens.find(
    token => token.tokenId === tokenId
  );

  if (!tokenMetadata) {
    throw new Error(`Token ${tokenId} not supported`);
  }

  const tokenOnChain = tokenMetadata.addresses.find(
    token => token.chain.id === chainId
  );

  if (!tokenOnChain) {
    throw new Error(
      `Token ${tokenId} not supported on ${getChainName(chainId)}`
    );
  }

  return tokenOnChain.address;
};

/**
 * Get the ETH balance of an address on the given chain
 */
export const getETHBalance = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const publicClient = getPublicClient({ chainId });
  return await publicClient.getBalance({ address });
};

/**
 * Get the ETH/ERC20 balance of an address on the given chain
 */
export const getTokenBalance = async ({
  address,
  tokenAddress,
  chainId,
}: {
  address: Hex;
  tokenAddress: Hex;
  chainId: number;
}) => {
  const balance =
    tokenAddress === NATIVE_TOKEN_ADDRESS
      ? await getETHBalance({
          address,
          chainId,
        })
      : await getERC20TokenBalance({
          contractAddress: tokenAddress,
          chainId,
          address,
        });

  return balance;
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

/**
 * Convert a Coingecko token ID to a Raylac token ID
 */
export const toCoingeckoTokenId = (tokenId: string) => {
  switch (tokenId) {
    case 'eth':
      return 'ethereum';
    default:
      throw new Error(`Unsupported Coingecko token ID: ${tokenId}`);
  }
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

export const getBlockExplorerUrl = (chainId: number) => {
  switch (chainId) {
    case chains.baseSepolia.id:
      return `https://sepolia.basescan.org`;
    case chains.base.id:
      return `https://basescan.org`;
    case chains.arbitrum.id:
      return `https://arbiscan.io`;
    default:
      throw new Error(`Chain ${chainId} not supported`);
  }
};

// Function signature of the `execute` function in RaylacAccount.sol
export const RAYLAC_ACCOUNT_EXECUTE_FUNC_SIG = '0xda0980c7';

// Function signature of the `transfer` function in ERC20.sol
export const ERC20_TRANSFER_FUNC_SIG = '0xa9059cbb';

export const USER_OP_EVENT_SIG =
  '0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f';

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

/**
 * Return the minimum BigInt from an array of BigInts
 */
export const bigIntMin = (values: bigint[]) => {
  // Use reduce to find the minimum BigInt
  const minBigInt = values.reduce((min, current) =>
    current < min ? current : min
  );

  return minBigInt;
};

/**
 * Return the maximum BigInt from an array of BigInts
 */
export const bigIntMax = (values: bigint[]) => {
  const maxBigInt = values.reduce((max, current) =>
    current > max ? current : max
  );

  return maxBigInt;
};

/**
 * Get the token ID of a token with a given address on a chain
 */
export const getTokenId = ({
  chainId,
  tokenAddress,
}: {
  chainId: number;
  tokenAddress: Hex;
}) => {
  const token = supportedTokens.find(token =>
    token.addresses.find(
      address =>
        address.chain.id === chainId &&
        address.address === getAddress(tokenAddress)
    )
  );

  if (!token) {
    throw new Error(
      `Token with address ${tokenAddress} on ${getChainName(chainId)} not found`
    );
  }

  return token.tokenId;
};

/**
 *  Get the token metadata for a given token ID
 */
export const getTokenMetadata = (tokenId: string) => {
  return supportedTokens.find(token => token.tokenId === tokenId);
};

export const MIN_USERNAME_LENGTH = 3;
export const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

/**
 * Check if a username is valid.
 * username must be between 3 and 32 characters long
 * and can only contain letters, numbers, dots, underscores and dashes
 */
export const isValidUsername = (username: string) => {
  return (
    username.length >= MIN_USERNAME_LENGTH && USERNAME_REGEX.test(username)
  );
};

export const getCoingeckoClient = () => {
  const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

  if (!COINGECKO_API_KEY) {
    throw new Error('COINGECKO_API_KEY is not set');
  }

  return axios.create({
    baseURL: 'https://pro-api.coingecko.com/api/',
    headers: {
      'x-cg-pro-api-key': COINGECKO_API_KEY,
    },
  });
};

/**
 * Get traces that all calls recursively.
 * (Filters out static calls, delegate calls, etc.)
 * - Assigns traceAddress to each call.
 */
const getCalls = (
  tx: BlockTransactionResponse,
  txHash: Hex,
  traceAddress: number[] = []
): TraceWithTraceAddress[] => {
  if (tx.calls) {
    return [
      { ...tx, txHash, traceAddress },
      ...tx.calls.flatMap((call, index) =>
        getCalls(call, txHash, [...traceAddress, index])
      ),
    ];
  }

  return [{ ...tx, txHash, traceAddress }];
};

/**
 * Get native transfer traces in the given block
 * - Calls the `trace_block` RPC method under the hood, and only returns calls
 *   that are `CALL` type and have a value
 */
export const getNativeTransferTracesInBlock = async ({
  blockNumber,
  chainId,
}: {
  blockNumber: bigint;
  chainId: number;
}): Promise<TraceWithTraceAddress[]> => {
  const traceBlockResult = await traceBlockByNumber({
    chainId,
    blockNumber,
  });

  const devChainIds = devChains.map(c => c.id);

  if (devChainIds.includes(chainId)) {
    const callsWithValues = (
      traceBlockResult as AnvilBlockTraceResponse
    ).filter(tx => tx.action.callType === 'call' && tx.action.value !== '0x0');

    return callsWithValues.map(tx => ({
      from: tx.action.from,
      gas: tx.action.gas,
      gasUsed: tx.result.gasUsed,
      to: tx.action.to,
      input: tx.action.input,
      calls: [],
      value: tx.action.value,
      type: 'CALL',
      txHash: tx.transactionHash,
      traceAddress: tx.traceAddress,
    }));
  }

  const callsWithValuesInBlock = (traceBlockResult as BlockTraceResponse)
    .flatMap(tx => getCalls(tx.result, tx.txHash))
    .filter(call => call.type === 'CALL' && call.value && call.value !== '0x0');

  return callsWithValuesInBlock;
};

export const getChainName = (chainId: number) => {
  return `${getChainFromId(chainId).name} (${chainId})`;
};

export const encodeUserActionTag = ({
  groupTag,
  groupSize,
  userActionType,
}: {
  groupTag: Hex;
  groupSize: number;
  userActionType: UserActionType;
}) => {
  if (groupSize < 1 || groupSize > 255) {
    throw new Error('Group size must be between 1 and 255');
  }

  if (groupTag.replace('0x', '').length !== 64) {
    throw new Error('Group tag must be 32 bytes');
  }

  const groupSizeHex = toHex(groupSize, { size: 2 }).replace('0x', '');
  const userActionTypeHex = userActionType.replace('0x', '');

  const tag = `${groupTag}${groupSizeHex}${userActionTypeHex}` as Hex;

  return tag;
};

/**
 * Get the hash of a UserAction from the tx hashes that constitute it
 */
export const getUserActionHash = (txHashes: Hex[]) => {
  const sortedTxHashes = txHashes.sort();

  let txHashesBytes = Buffer.alloc(0);

  for (const txHash of sortedTxHashes) {
    txHashesBytes = Buffer.concat([txHashesBytes, toBytes(txHash)]);
  }

  return keccak256(txHashesBytes);
};

export const generateRandomMultiChainTag = (): Hex => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);

  return pad(toHex(array), { size: 32 });
};
