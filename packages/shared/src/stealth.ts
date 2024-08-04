import * as secp from '@noble/secp256k1';
import {
  Chain,
  HttpTransport,
  PublicClient,
  hexToBigInt,
  keccak256,
  toHex,
} from 'viem';
import { Hex } from 'viem';
import { getInitCode, getSenderAddress } from './erc4337';
import { hexToProjectivePoint, projectivePointToHex } from './utils';

const g = {
  x: secp.CURVE.Gx,
  y: secp.CURVE.Gy,
};

/**
 * Get the address of the contract account created by the given stealthPubKey.
 * This functions calls the `getSenderAddress` function of the entry point contract.
 */
export const getStealthAddress = async ({
  client,
  stealthSigner,
}: {
  client: PublicClient<HttpTransport, Chain>;
  stealthSigner: Hex;
}) => {
  const initCode = getInitCode({ stealthSigner });

  const senderAddress = await getSenderAddress({
    client,
    initCode,
  });

  return senderAddress;
};

/**
 * Recover the private key that corresponds to a stealth public key.
 */
export const recoveryStealthPrivKey = (input: {
  ephemeralPubKey: Hex;
  viewingPrivKey: Hex;
  spendingPrivKey: Hex;
}) => {
  const ephemeralPubKey = hexToProjectivePoint(input.ephemeralPubKey);
  const viewingPrivKey = hexToBigInt(input.viewingPrivKey);
  const spendingPrivKey = hexToBigInt(input.spendingPrivKey);

  const secret = ephemeralPubKey.multiply(viewingPrivKey);
  const secretHashHex = keccak256(`0x${secret.toHex()}`);
  const secretHash = BigInt(secretHashHex);

  const stealthPrivKey = (spendingPrivKey + secretHash) % secp.CURVE.n;
  return toHex(stealthPrivKey, {
    size: 32,
  });
};

/**
 * Check if the given stealth public key matches the given spending and viewing public keys.
 */
export const checkStealthAddress = (input: {
  ephemeralPubKey: Hex;
  stealthPubKey: Hex;
  spendingPubKey: Hex;
  viewTag: Hex;
  viewingPrivKey: Hex;
}): boolean => {
  const ephemeralPubKey = hexToProjectivePoint(input.ephemeralPubKey);
  const stealthPubKey = hexToProjectivePoint(input.stealthPubKey);
  const spendingPubKey = hexToProjectivePoint(input.spendingPubKey);
  const viewingPrivKey = hexToBigInt(input.viewingPrivKey);
  const viewTag = input.viewTag;

  const secret = ephemeralPubKey.multiply(viewingPrivKey);

  const secretHashHex = keccak256(`0x${secret.toHex()}`);
  const secretHash = BigInt(secretHashHex);

  if (viewTag !== secretHashHex.slice(2, 4)) {
    console.log('View tag does not match');
    return false;
  }
  const sH = secp.ProjectivePoint.fromAffine(g).multiply(secretHash);

  const recoveredPubKey = spendingPubKey.add(sH);

  return recoveredPubKey.equals(stealthPubKey);
};

/**
 * Generate a stealth address for the given spending and viewing public keys.
 */
export const generateStealthAddress = (input: {
  spendingPubKey: Hex;
  viewingPubKey: Hex;
}) => {
  const spendingPubKey = hexToProjectivePoint(input.spendingPubKey);
  const viewingPubKey = hexToProjectivePoint(input.viewingPubKey);

  const privEphemeral = secp.utils.randomPrivateKey(); // Secure random private key
  const ephemeralPubKey = secp.ProjectivePoint.fromPrivateKey(privEphemeral);

  const sharedSecret = viewingPubKey.multiply(
    BigInt('0x' + Buffer.from(privEphemeral).toString('hex'))
  );
  const secretHashHex = keccak256(`0x${sharedSecret.toHex()}`);

  const viewTag = `0x${secretHashHex.slice(2, 4)}` as Hex;

  const secretHash = BigInt(secretHashHex);

  const g = {
    x: secp.CURVE.Gx,
    y: secp.CURVE.Gy,
  };
  const sH = secp.ProjectivePoint.fromAffine(g).multiply(secretHash);

  const stealthPubKey = spendingPubKey.add(sH);

  return {
    stealthPubKey: projectivePointToHex(stealthPubKey),
    ephemeralPubKey: projectivePointToHex(ephemeralPubKey),
    viewTag,
  };
};
