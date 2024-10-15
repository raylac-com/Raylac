import dotenv from 'dotenv';
import { Hex } from 'viem';
import prisma from './lib/prisma';
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
 * Decrypt data.
 * This is used to decrypt the viewing private key so it can be securely retrieved from the database.
 */
const decryptViewingPrivKey = (encryptedViewingPrivKey: Hex) => {
  const iv = Buffer.from(
    encryptedViewingPrivKey.replace('0x', '').slice(0, 32),
    'hex'
  );
  const encryptedData = encryptedViewingPrivKey.replace('0x', '').slice(32);

  const buff = Buffer.from(encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  return (
    decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
    decipher.final('utf8')
  );
};

const encryptViewingKeys = async () => {
  const viewingKeys = await prisma.user.findMany({
    select: {
      id: true,
      viewingPrivKey: true,
    },
  });

  for (const user of viewingKeys) {
    const encryptedViewingPrivKey = encryptViewingPrivKey(
      user.viewingPrivKey as Hex
    );

    const decryptedViewingPrivKey = decryptViewingPrivKey(
      encryptedViewingPrivKey
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        encryptedViewingPrivKey,
      },
    });
  }
};

encryptViewingKeys();
