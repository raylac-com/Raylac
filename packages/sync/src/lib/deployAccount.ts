import { Hex } from 'viem';
import prisma from './prisma';
import {
  getInitCode,
  getWalletClient,
  SENDER_CREATOR_ADDRESS,
} from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { SenderCreatorAbi } from '@raylac/shared';
import logger from './logger';

const ACCOUNT_DEPLOYER_PRIV_KEY = process.env.ACCOUNT_DEPLOYER_PRIV_KEY;

if (!ACCOUNT_DEPLOYER_PRIV_KEY) {
  throw new Error('ACCOUNT_DEPLOYERS_PRIV_KEY is not set');
}

const deployerAccount = privateKeyToAccount(ACCOUNT_DEPLOYER_PRIV_KEY as Hex);

const deployAccount = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const stealthAddress = await prisma.userStealthAddress.findUnique({
    select: {
      ephemeralPubKey: true,
      signerAddress: true,
    },
    where: {
      address,
    },
  });

  if (!stealthAddress) {
    logger.error(`Stealth address not found for ${address}`);
    return;
  }

  const initCode = getInitCode({
    stealthSigner: stealthAddress.signerAddress as Hex,
  });

  const walletClient = getWalletClient({
    chainId,
  });

  const txHash = await walletClient.writeContract({
    account: deployerAccount,
    address: SENDER_CREATOR_ADDRESS,
    abi: SenderCreatorAbi,
    functionName: 'createSender',
    args: [initCode],
    // We need to explicitly set the gas limit here because viem's estimate is lower than the actual gas used.
    gas: BigInt(150_000),
  });

  return txHash;
};

export default deployAccount;