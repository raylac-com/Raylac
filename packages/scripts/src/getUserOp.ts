import 'dotenv/config';
import { getUserOpReceipt } from '@sutori/shared';
import { publicClient } from './client';

const getUserOp = async () => {
  const hash =
    '0xf07c0d8f7b5432ab13d8e08ad7a9dcead322e5b09aa9d800604521b41272527e';

  const receipt = await getUserOpReceipt({
    client: publicClient,
    hash,
  });

  console.log(receipt);
};

getUserOp();
