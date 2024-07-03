/*
import {
  ACCOUNT_FACTORY_ADDRESS,
  ACCOUNT_IMPL_ADDRESS,
  AccountFactoryAbi,
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  SutoriAccountAbi,
} from '@sutori/shared';
import { walletClient } from './client';
import { getSenderAddress, getUserOpHash, handleOps } from './entryPoint';
import { UserOperation } from './types';
import {
  Hex,
  concat,
  encodeFunctionData,
  encodePacked,
  padHex,
  parseEther,
  toBytes,
  toHex,
  zeroAddress,
} from 'viem';
import { packUserOperation } from './utils';
import { readContract } from 'viem/actions';

const transferEth = async () => {
  // Construct a user operation
  // Call handleOps
  const recoveryPubKey = sender.address;

  const factoryAddress = padHex(ACCOUNT_FACTORY_ADDRESS, {
    size: 20,
  });

  const ephemeralPubKey = sender.publicKey;

  // await createAccount(ephemeralPubKey);

  // Create account directly

  const factoryData = encodeFunctionData({
    abi: AccountFactoryAbi,
    functionName: 'createAccount',
    args: [ephemeralPubKey],
  });

  const initCode = (factoryAddress + factoryData.slice(2)) as Hex;
  const senderAddress = await getSenderAddress(initCode);

  if (!senderAddress) {
    throw new Error('Sender address not found');
  }

  console.log('Sender address:', senderAddress);

  // Fund the sender
  await walletClient.sendTransaction({
    account: bundler,
    value: parseEther('10'),
    to: senderAddress,
  });

  const senderBalance = await publicClient.getBalance({
    address: senderAddress,
  });

  console.log('Sender balance:', senderBalance);

  const nonce = await publicClient.readContract({
    address: ENTRY_POINT_ADDRESS,
    abi: EntryPointAbi,
    functionName: 'getNonce',
    args: [senderAddress, BigInt(0)],
  });

  const target = zeroAddress;

  const callData = encodeFunctionData({
    abi: SutoriAccountAbi,
    functionName: 'execute',
    args: [target, parseEther('0.01'), '0x0'],
  });

  let userOp: UserOperation = {
    sender: senderAddress,
    nonce,
    initCode,
    callData,
    callGasLimit: BigInt(100_000),
    verificationGasLimit: BigInt(300_000),
    preVerificationGas: BigInt(0),
    maxFeePerGas: parseEther('0.000001'),
    maxPriorityFeePerGas: parseEther('0'),
    paymasterAndData: '0x',
    signature: '0x',
  };

  const userOpHash = await getUserOpHash(userOp);

  console.log('User op hash:', userOpHash);

  const signature = await walletClient.signMessage({
    account: sender,
    message: userOpHash,
  });

  userOp.signature = signature;

  const code = await publicClient.getCode({
    address: userOp.sender,
  });

  await handleOps({
    ops: [userOp],
    beneficiary: bundler.address,
  });
};

transferEth();
*/