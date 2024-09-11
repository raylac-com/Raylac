import 'dotenv/config';
import { getUserOpReceipt } from '@raylac/shared';
import { publicClient } from './viem';

const getUserOp = async () => {
  const hash =
    '0x84e87fb46544dc67be0116f514351bd9dab64583e3ce031053460141b4abb1fe';

  const receipt = await getUserOpReceipt({
    client: publicClient,
    hash,
  });

  console.log(receipt);
};

getUserOp();
