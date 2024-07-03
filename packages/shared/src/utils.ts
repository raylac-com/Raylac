import * as secp from '@noble/secp256k1';
import { Chain, Hex } from 'viem';
import { base, baseSepolia } from 'viem/chains';

const ALCHEMY_BASE_SEPOLIA_API_KEY = process.env.ALCHEMY_BASE_SEPOLIA_API_KEY;
const ALCHEMY_BASE_API_KEY = process.env.ALCHEMY_BASE_API_KEY;

export const getChain = () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.CHAIN === 'sepolia'
  ) {
    return baseSepolia;
  }

  return base;
};

export const getEthRpcUrl = (chain: Chain) => {
  if (chain === baseSepolia) {
    return `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_BASE_SEPOLIA_API_KEY}`;
  } else if (chain === base) {
    return `https://base.g.alchemy.com/v2/${ALCHEMY_BASE_API_KEY}`;
  } else {
    throw new Error(`Unknown chain: ${chain}`);
  }
};

export const encodeERC5564Metadata = ({
  viewTag,
  stealthPubKey,
}: {
  viewTag: Hex;
  stealthPubKey: Hex;
}) => {
  if (viewTag.length !== 4) {
    throw new Error(
      `viewTag must be exactly 4 bytes, got ${viewTag.length} hex chars`
    );
  }

  /*
  if (stealthPubKey.length !== 68) {
    throw new Error(
      `stealthPubKey must be exactly 33 bytes, got ${stealthPubKey.length} hex chars`
    );
  }
  */

  const metadata = `${viewTag}${stealthPubKey.replace('0x', '')}`;
  return metadata;
};

export const decodeERC5564Metadata = (metadata: Hex) => {
  if (metadata.length !== 70) {
    throw new Error(
      `metadata must be exactly 66 bytes, got ${metadata.length} hex chars`
    );
  }

  const viewTag = metadata.slice(0, 4);
  const stealthPubKey = `0x${metadata.slice(4)}`;

  return { viewTag, stealthPubKey };
};

export const hexToProjectivePoint = (hex: Hex) => {
  /*
  if (hex.length !== 68) {
    throw new Error(
      `hex must be exactly 33 bytes, got ${hex.length} hex chars`
    );
  }
    */

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