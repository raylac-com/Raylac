import prisma from '../lib/prisma';
import { JWT_PRIV_KEY } from '../utils';
import { buildSiweMessage, getPublicClient } from '@raylac/shared';
import jwt from 'jsonwebtoken';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { verifySiweMessage } from 'viem/siwe';

/**
 * Verify the signature of a user's sign-in request,
 * and return the user and a JWT token if the signature is valid.
 */
const signIn = async ({
  issuedAt,
  userSpendingPubKey,
  signature,
}: {
  issuedAt: string;
  userSpendingPubKey: string;
  signature: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      spendingPubKey: userSpendingPubKey,
    },
  });

  if (!user) {
    throw new Error(`User not found`);
  }

  const userAddress = publicKeyToAddress(user.spendingPubKey as Hex);

  const publicClient = getPublicClient({
    chainId: mainnet.id,
  });

  const message = buildSiweMessage({
    issuedAt: new Date(issuedAt),
    address: userAddress,
    chainId: publicClient.chain.id,
  });

  const isSigValid = await verifySiweMessage(publicClient, {
    address: userAddress,
    message,
    signature: signature as Hex,
  });

  if (!isSigValid) {
    throw new Error('Invalid signature');
  }

  const token = jwt.sign({ userId: user.id }, JWT_PRIV_KEY);

  return { user, token };
};

export default signIn;
