import prisma from '../lib/prisma';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { mimeTypeToExtension } from '@raylac/shared';
import { v4 as uuidv4 } from 'uuid';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS must be set');
}

initializeApp({
  credential: applicationDefault(),
  storageBucket: 'raylac-72351.appspot.com',
});

const bucket = getStorage().bucket();

const updateProfileImage = async ({
  userId,
  mimeType,
  imageBase64,
}: {
  userId: number;
  mimeType: string;
  imageBase64: string;
}) => {
  const extension = mimeTypeToExtension(mimeType);
  const fileName = `${uuidv4()}.${extension}`;
  const tempFilePath = path.join(os.tmpdir(), fileName);

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(tempFilePath, imageBase64, 'base64');

  await bucket.upload(tempFilePath, {
    destination: fileName,
  });

  const publicUrl = bucket.file(fileName).publicUrl();

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profileImage: publicUrl,
    },
  });

  return publicUrl;
};

export default updateProfileImage;
