import 'dotenv/config';
import { getPublicClient, getUserOpReceipt } from '@raylac/shared';
import { arbitrumSepolia, base, baseSepolia } from 'viem/chains';

const getUserOp = async () => {
  const hash =
    //    '0x38180819964cce753fad66def22cafe6ae0cd434ec3d4bc5723543b1dd80e839';
    '0x6DA870CBDC86827CC1F4882FBD2432E47682B1352D46F6B7FC4C4EBDA96A8432';

  const client = getPublicClient({
    chainId: base.id,
  });

  const receipt = await getUserOpReceipt({
    client,
    hash,
  });

  console.log(receipt);
};

getUserOp();
