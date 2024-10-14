import { publicKeyToAddress } from 'viem/accounts';
import prisma from './lib/prisma';
import { Hex } from 'viem';

const assignSignerAddress = async () => {
  const stealthAddresses = await prisma.userStealthAddress.findMany({
    where: {
      signerAddress: null,
    },
  });

  console.log(`Found ${stealthAddresses.length} stealth addresses to assign`);

  for (const stealthAddress of stealthAddresses) {
    const signerAddress = publicKeyToAddress(
      stealthAddress.stealthPubKey as Hex
    );

    await prisma.userStealthAddress.update({
      where: {
        id: stealthAddress.id,
      },
      data: { signerAddress },
    });
  }
};

assignSignerAddress();
