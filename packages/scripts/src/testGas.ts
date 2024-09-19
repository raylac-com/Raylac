import 'dotenv/config';
import {
  buildERC20TransferUserOp,
  buildETHTransferUserOp,
  getSpendingPrivKey,
  getViewingPrivKey,
} from '@raylac/shared';
import { signInWithMnemonic } from './auth';
import { getAuthedClient } from './rpc';
import { publicKeyToAddress } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { Hex, parseUnits } from 'viem';

const mnemonic =
  'first flat achieve eight course potato common idea fuel brief torch album';

const preVerificationGas = BigInt(100_000)
const verificationGasLimitWithInit = BigInt(210_000)
const verificationGasLimit = BigInt(70_000)

const callGasLimit = BigInt(40_000)

const alreadyDeployedETHTransfer = {
  preVerificationGas: '0x22897',
  callGasLimit: '0x4bb8',
  verificationGasLimit: '0xf173',
};

const preDeployETHTransfer = {
  preVerificationGas: '0x1f4da',
  callGasLimit: '0x4bb8',
  verificationGasLimit: '0x312a4',
};

const preDeployERC20Transfer = {
  preVerificationGas: '0x177fd',
  callGasLimit: '0x7bb8',
  verificationGasLimit: '0x313dc',
};

const alreadyDeployedERC20Transfer = {
};

const printGas = () => {
  console.log('alreadyDeployedETHTransfer', {
    preVerificationGas: BigInt(
      alreadyDeployedETHTransfer.preVerificationGas
    ).toLocaleString(),
    callGasLimit: BigInt(
      alreadyDeployedETHTransfer.callGasLimit
    ).toLocaleString(),
    verificationGasLimit: BigInt(
      alreadyDeployedETHTransfer.verificationGasLimit
    ).toLocaleString(),
  });

  console.log('preDeployETHTransfer', {
    preVerificationGas: BigInt(
      preDeployETHTransfer.preVerificationGas
    ).toLocaleString(),
    callGasLimit: BigInt(preDeployETHTransfer.callGasLimit).toLocaleString(),
    verificationGasLimit: BigInt(
      preDeployETHTransfer.verificationGasLimit
    ).toLocaleString(),
  });

  console.log('preDeployERC20Transfer', {
    preVerificationGas: BigInt(
      preDeployERC20Transfer.preVerificationGas
    ).toLocaleString(),
    callGasLimit: BigInt(preDeployERC20Transfer.callGasLimit).toLocaleString(),
    verificationGasLimit: BigInt(
      preDeployERC20Transfer.verificationGasLimit
    ).toLocaleString(),
  });
};

// printGas();

const testGas = async () => {
  const spendingPrivKey = await getSpendingPrivKey(mnemonic);
  const viewingPrivKey = await getViewingPrivKey(mnemonic);

  const { userId, token } = await signInWithMnemonic({
    mnemonic,
  });

  const authedClient = getAuthedClient(token);

  const stealthAccounts = await authedClient.getStealthAccounts.query();
  const chainId = baseSepolia.id;
  const to = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';
  const amount = parseUnits('0.001', 18);

  /*
  const userOp = await buildETHTransferUserOp({
    stealthSigner: publicKeyToAddress(
      stealthAccounts.find(
        account =>
          account.address === '0xf3dFa83fA4E932F374557cD1f9806FD926e44667'
      )?.stealthPubKey as Hex
    ),
    to,
    amount,
    chainId,
    tag: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
  });
  */

  const erc20UserOp = await buildERC20TransferUserOp({
    stealthSigner: publicKeyToAddress(
      stealthAccounts.find(
        account =>
          account.address === '0xf3dFa83fA4E932F374557cD1f9806FD926e44667'
      )?.stealthPubKey as Hex
    ),
    to,
    amount,
    chainId,
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    tag: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
  });

  console.log(erc20UserOp);
};

const estimateERC20TransferGas = async () => {
  const { userId, token } = await signInWithMnemonic({
    mnemonic,
  });

  const authedClient = getAuthedClient(token);

  const stealthAccounts = await authedClient.getStealthAccounts.query();

  const amount = parseUnits('1', 6);
  const chainId = baseSepolia.id;
  const to = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';

  const erc20UserOp = await buildERC20TransferUserOp({
    stealthSigner: publicKeyToAddress(
      stealthAccounts.find(
        account =>
          account.address === '0xf3dFa83fA4E932F374557cD1f9806FD926e44667'
      )?.stealthPubKey as Hex
    ),
    to,
    amount,
    chainId,
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    tag: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
  });

  console.log(erc20UserOp);
};

// estimateERC20TransferGas();
printGas();
