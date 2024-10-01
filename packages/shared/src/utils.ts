import * as secp from '@noble/secp256k1';
import {
  Chain,
  decodeFunctionData,
  formatUnits,
  getAddress,
  Hex,
  parseUnits,
} from 'viem';
import {
  ChainGasInfo,
  RaylacAccountTransferData,
  UserOperation,
} from './types';
import RaylacAccountAbi from './abi/RaylacAccountAbi';
import ERC20Abi from './abi/ERC20Abi';
import * as chains from 'viem/chains';
import { Network } from 'alchemy-sdk';
import supportedTokens, { NATIVE_TOKEN_ADDRESS } from './supportedTokens';
import { getPublicClient } from './ethRpc';
import { getERC20TokenBalance, rundlerMaxPriorityFeePerGas } from '.';
import supportedChains from './supportedChains';
import { Prisma } from '@prisma/client';

export const encodeERC5564Metadata = ({
  viewTag,
  stealthPubKey,
}: {
  viewTag: Hex;
  stealthPubKey: Hex;
}): Hex => {
  if (viewTag.length !== 4) {
    throw new Error(
      `viewTag must be exactly 4 bytes, got ${viewTag.length} hex chars`
    );
  }

  const metadata = `${viewTag}${stealthPubKey.replace('0x', '')}` as Hex;
  return metadata;
};

export const decodeERC5564Metadata = (metadata: Hex) => {
  if (metadata.length !== 70) {
    throw new Error(
      `metadata must be exactly 66 bytes, got ${metadata.length} hex chars`
    );
  }

  const viewTag = metadata.slice(0, 4) as Hex;
  const stealthPubKey = `0x${metadata.slice(4)}` as Hex;

  return { viewTag, stealthPubKey };
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
    abi: RaylacAccountAbi,
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
    abi: RaylacAccountAbi,
    data: userOp.callData,
  });

  if (functionName !== 'execute') {
    throw new Error("Function name must be 'execute'");
  }

  const [to, value, data] = args;

  return {
    to,
    value,
    data,
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

/**
 * Convert viem's `Chain` object to Alchemy's `Network` enum
 */
export const toAlchemyNetwork = (chainId: number) => {
  switch (chainId) {
    case chains.base.id:
      return Network.BASE_MAINNET;
    case chains.baseSepolia.id:
      return Network.BASE_SEPOLIA;
    case chains.optimism.id:
      return Network.OPT_MAINNET;
    case chains.optimismSepolia.id:
      return Network.OPT_SEPOLIA;
    case chains.arbitrum.id:
      return Network.ARB_MAINNET;
    case chains.arbitrumSepolia.id:
      return Network.ARB_SEPOLIA;
    default:
      throw new Error(`Chain ${chainId} not supported`);
  }
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
    throw new Error(`Token ${tokenId} not supported on chain ${chainId}`);
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

/**
 * Get the chains to use based on the mode (dev or prod)
 */
export const getChainsForMode = (isDevMode: boolean) => {
  return isDevMode
    ? supportedChains.filter(chain => chain.testnet)
    : supportedChains.filter(chain => !chain.testnet);
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
    default:
      throw new Error(`Chain ${chainId} not supported`);
  }
};

/**
 * Decode the `data` field of the `execute` function in RaylacAccount.sol as a token transfer.
 * If the `to` field of the call is an ERC20 token, decode the `data` field as an ERC20 transfer.
 * Otherwise, decode the `data` field as an ETH transfer.
 */
export const decodeExecuteAsTransfer = ({
  executeArgs,
  chainId,
}: {
  executeArgs: {
    to: Hex;
    value: bigint;
    data: Hex;
    tag: Hex;
  };
  chainId: number;
}): RaylacAccountTransferData | null => {
  // Check if the `to` field of the call is an ERC20 token
  const erc20TokenData = supportedTokens.find(token =>
    token.addresses.find(
      address =>
        address.chain.id === chainId && address.address === executeArgs.to
    )
  );

  const tag = executeArgs.tag;

  if (erc20TokenData) {
    // This is a call to an ERC20 token

    // Decode the data field of the call
    const decodedData = decodeFunctionData({
      abi: ERC20Abi,
      data: executeArgs.data,
    });

    if (decodedData.functionName === 'transfer') {
      return {
        type: 'Transfer',
        to: decodedData.args[0],
        amount: BigInt(decodedData.args[1]),
        tokenId: erc20TokenData.tokenId,
        tag,
      };
    } else {
      return null;
    }
  } else if (executeArgs.data === '0x') {
    return {
      type: 'Transfer',
      to: executeArgs.to,
      amount: executeArgs.value,
      tokenId: 'eth',
      tag,
    };
  } else {
    return {
      type: 'Transfer',
      to: executeArgs.to,
      amount: executeArgs.value,
      tokenId: 'eth',
      tag,
    };
  }
};

/**
 * Convert a decoded trace to a `TransferTrace` record in the Postgres database.
 */
export const traceToPostgresRecord = ({
  transferData,
  traceTxHash,
  traceTxPosition,
  traceAddress,
  blockNumber,
  fromAddress,
  chainId,
}: {
  transferData: RaylacAccountTransferData;
  traceTxHash: Hex;
  traceTxPosition: number;
  traceAddress: number[];
  blockNumber: bigint;
  fromAddress: Hex;
  chainId: number;
}): Prisma.TransferTraceCreateManyInput => {
  const to = transferData.to;
  const amount = transferData.amount;

  return {
    from: getAddress(fromAddress),
    to: getAddress(to),
    amount,
    tokenId: transferData.tokenId,
    blockNumber,
    txHash: traceTxHash,
    txPosition: traceTxPosition,
    traceAddress: traceAddress.join('_'),
    executionType: transferData.type,
    executionTag: transferData.tag,
    chainId,
  };
};

export const RAYLAC_ACCOUNT_EXECUTE_FUNC_SIG = '0xda0980c7';

/**
 * Get the gas info for all supported chains
 */
export const getGasInfo = async ({
  isDevMode,
}: {
  isDevMode: boolean;
}): Promise<ChainGasInfo[]> => {
  const chains = getChainsForMode(isDevMode);

  const gasInfo: ChainGasInfo[] = [];
  for (const chain of chains) {
    const client = getPublicClient({ chainId: chain.id });
    const block = await client.getBlock({ blockTag: 'latest' });
    const maxPriorityFeePerGas = await rundlerMaxPriorityFeePerGas({ client });

    if (block.baseFeePerGas === null) {
      throw new Error('baseFeePerGas is null');
    }

    gasInfo.push({
      chainId: chain.id,
      baseFeePerGas: block.baseFeePerGas,
      maxPriorityFeePerGas,
    });
  }

  return gasInfo;
};
