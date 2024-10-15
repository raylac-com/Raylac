import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { JWT_PRIV_KEY } from '../utils';
import { isValidUsername } from '@raylac/shared';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

const algorithm = 'aes-256-cbc'; // AES algorithm

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is not set');
}

/**
 * Encrypt the viewing private key so it can be securely stored in the database.
 */
const encryptViewingPrivKey = (viewingPrivKey: Hex): Hex => {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  const encryptedData = Buffer.from(
    cipher.update(viewingPrivKey, 'utf8', 'hex') + cipher.final('hex')
  );

  return `0x${Buffer.concat([iv, encryptedData]).toString('hex')}` as Hex;
};
/**
 * Sign up a new user.
 * - Save the user to the database
 * - Send a sign-up bonus to the user
 * @returns The `user` object and a JWT token
 */
const signUp = async ({
  viewingPrivKey,
  spendingPubKey,
  name,
  username,
}: {
  viewingPrivKey: Hex;
  spendingPubKey: Hex;
  name: string;
  username: string;
}) => {
  const viewingAccount = privateKeyToAccount(viewingPrivKey as Hex);

  if (!isValidUsername(username)) {
    throw new Error(`Invalid username ${username}`);
  }

  const isUsernameTaken = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  if (isUsernameTaken) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Username ${username} is already taken`,
    });
  }

  const encryptedViewingPrivKey = encryptViewingPrivKey(viewingPrivKey);

  const user = await prisma.user.create({
    data: {
      name: name,
      username: username,
      spendingPubKey: spendingPubKey,
      viewingPubKey: viewingAccount.publicKey,
      viewingPrivKey: viewingPrivKey,
      encryptedViewingPrivKey: encryptedViewingPrivKey,
    },
  });

  const token = jwt.sign({ userId: user.id }, JWT_PRIV_KEY);

  return {
    user,
    token,
  };
};

export default signUp;
