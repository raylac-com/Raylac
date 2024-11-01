import { getSenderAddress } from '@raylac/shared';
import prisma from './lib/prisma';

const getInvalidAddress = async () => {
  const singerAddress = '0x3f915c66e672f1AbE0bc0dE7c6C3a7Bc369cAa7a';

  const address = getSenderAddress({
    stealthSigner: singerAddress,
  });

  console.log(address);

  // const senderAddress = await prisma.
};

getInvalidAddress();
