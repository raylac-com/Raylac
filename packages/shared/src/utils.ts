import * as secp from '@noble/secp256k1';
import { Chain, decodeFunctionData, formatUnits, Hex, parseUnits } from 'viem';
import { UserOperation } from './types';
import RaylacAccountAbi from './abi/RaylacAccountAbi';
import ERC20Abi from './abi/ERC20Abi';
import * as chains from 'viem/chains';
import { Network } from 'alchemy-sdk';
import supportedTokens, { NATIVE_TOKEN_ADDRESS } from './supportedTokens';
import { getPublicClient } from './ethRpc';
import { getERC20TokenBalance } from '.';
import supportedChains from './supportedChains';

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

  if (formatted === '0') {
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
