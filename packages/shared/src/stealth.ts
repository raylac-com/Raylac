import * as secp from '@noble/secp256k1';
import {
  encodeDeployData,
  encodeFunctionData,
  getContractAddress,
  hexToBigInt,
  keccak256,
  toHex,
} from 'viem';
import { Hex } from 'viem';
import { hexToProjectivePoint, projectivePointToHex } from './utils';
import { publicKeyToAddress } from 'viem/accounts';
import { StealthAddressWithEphemeral } from './types';
import {
  ACCOUNT_FACTORY_ADDRESS,
  ACCOUNT_IMPL_ADDRESS,
  RaylacAccountAbi,
  RaylacAccountProxyAbi,
  RaylacAccountProxyBytecode,
} from '.';

const g = {
  x: secp.CURVE.Gx,
  y: secp.CURVE.Gy,
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
 * Get the address of the contract account created by the given stealthPubKey.
 */
export const getSenderAddress = ({ stealthSigner }: { stealthSigner: Hex }) => {
  const data = encodeDeployData({
    abi: RaylacAccountProxyAbi,
    bytecode: RaylacAccountProxyBytecode,
    args: [
      ACCOUNT_IMPL_ADDRESS,
      encodeFunctionData({
        abi: RaylacAccountAbi,
        functionName: 'initialize',
        args: [stealthSigner],
      }),
    ],
  });

  const address = getContractAddress({
    bytecode: data,
    from: ACCOUNT_FACTORY_ADDRESS,
    opcode: 'CREATE2',
    salt: '0x0',
  });

  return address;
};

/**
 * Generate a stealth address for the given spending and viewing public keys.
 * Returns the stealth public key, ephemeral public key, and view tag.
 */
export const generateStealthAddress = (input: {
  spendingPubKey: Hex;
  viewingPubKey: Hex;
}): StealthAddressWithEphemeral => {
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
  const stealthPubKeyHex = projectivePointToHex(stealthPubKey);

  const stealthSigner = publicKeyToAddress(stealthPubKeyHex);

  const address = getSenderAddress({
    stealthSigner,
  });

  return {
    address,
    stealthPubKey: stealthPubKeyHex,
    ephemeralPubKey: projectivePointToHex(ephemeralPubKey),
    viewTag,
  };
};
