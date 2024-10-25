import { Hex } from 'viem';
import prisma from './prisma';
import {
  getInitCode,
  getPublicClient,
  getWalletClient,
  SENDER_CREATOR_ADDRESS,
} from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { SenderCreatorAbi } from '@raylac/shared';
import { logger } from '../utils';

const isAlreadyDeployed = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}): Promise<boolean> => {
  const client = getPublicClient({ chainId });
  const code = await client.getCode({ address });
  return code !== '0x';
};

/**
 * Deploys an account if it's not already deployed.
 */
const deployAccount = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const ACCOUNT_DEPLOYER_PRIV_KEY = process.env.ACCOUNT_DEPLOYER_PRIV_KEY;

  if (!ACCOUNT_DEPLOYER_PRIV_KEY) {
    throw new Error('ACCOUNT_DEPLOYERS_PRIV_KEY is not set');
  }

  const deployerAccount = privateKeyToAccount(ACCOUNT_DEPLOYER_PRIV_KEY as Hex);

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
    logger.info(`Stealth address not found for ${address}`);
    return;
  }

  if (await isAlreadyDeployed({ address, chainId })) {
    logger.info(`Account already deployed for ${address}`);
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
