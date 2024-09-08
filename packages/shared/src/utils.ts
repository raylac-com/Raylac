import * as secp from '@noble/secp256k1';
import { Hex, parseUnits } from 'viem';

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
