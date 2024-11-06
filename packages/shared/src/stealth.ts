import * as bip39 from 'bip39';
import { HDKey, hdKeyToAccount } from 'viem/accounts';
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
  ACCOUNT_IMPL_V2_ADDRESS,
  RaylacAccountV2Abi,
  ACCOUNT_FACTORY_V2_ADDRESS,
  RaylacAccountProxyBytecode,
  RaylacAccountProxyAbi,
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
 * Check if the given signer address matches the given spending and viewing public keys.
 */
export const checkStealthAddress = (input: {
  ephemeralPubKey: Hex;
  signerAddress: Hex;
  spendingPubKey: Hex;
  viewTag: Hex;
  viewingPrivKey: Hex;
}): boolean => {
  const ephemeralPubKey = hexToProjectivePoint(input.ephemeralPubKey);
  const spendingPubKey = hexToProjectivePoint(input.spendingPubKey);
  const viewingPrivKey = hexToBigInt(input.viewingPrivKey);
  const viewTag = input.viewTag;

  const secret = ephemeralPubKey.multiply(viewingPrivKey);

  const secretHashHex = keccak256(`0x${secret.toHex()}`);
  const secretHash = BigInt(secretHashHex);

  if (viewTag !== `0x${secretHashHex.slice(2, 4)}`) {
    return false;
  }

  const sH = secp.ProjectivePoint.fromAffine(g).multiply(secretHash);

  const recoveredPubKey = spendingPubKey.add(sH);
  const recoveredSignerAddress = publicKeyToAddress(
    projectivePointToHex(recoveredPubKey)
  );

  return recoveredSignerAddress === input.signerAddress;
};

export const getSenderAddressV2 = ({
  stealthSigner,
}: {
  stealthSigner: Hex;
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
        args: [stealthSigner],
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
 * Generate a stealth address for the given spending and viewing public keys.
 * Returns the stealth public key, ephemeral public key, and view tag.
 */
export const generateStealthAddressV2 = (input: {
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

  const signerAddress = publicKeyToAddress(stealthPubKeyHex);

  const address = getSenderAddressV2({
    stealthSigner: signerAddress,
  });

  return {
    address,
    signerAddress,
    ephemeralPubKey: projectivePointToHex(ephemeralPubKey),
    viewTag,
  };
};

/**
 * Get the private key of an `HDKey` in hex format.
 */
export const hdKeyToPrivateKey = (hdKey: HDKey): Hex => {
  return `0x${Buffer.from(hdKey.privateKey!).toString('hex')}`;
};

/**
 * Get the spending private key from a mnemonic
 */
export const getSpendingPrivKey = (mnemonic: string) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const hdKey = HDKey.fromMasterSeed(seed);

  const spendingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  return hdKeyToPrivateKey(spendingAccount.getHdKey());
};

/**
 * Get the viewing private key from a mnemonic
 */
export const getViewingPrivKey = (mnemonic: string) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);

  const viewingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 1,
  });

  return hdKeyToPrivateKey(viewingAccount.getHdKey());
};
