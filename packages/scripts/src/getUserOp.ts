import "dotenv/config";
import { getUserOpByHash } from '@sutori/shared';

const getUserOp = async () => {
  const hash =
    '0xf07c0d8f7b5432ab13d8e08ad7a9dcead322e5b09aa9d800604521b41272527e';
  const op = await getUserOpByHash(hash);

  console.log(op);
};

getUserOp();

