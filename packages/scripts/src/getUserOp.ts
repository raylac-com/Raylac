import 'dotenv/config';
import { getUserOpReceipt } from '@raylac/shared';
import { publicClient } from './viem';

const getUserOp = async () => {
  const hash =
    '0xde914954dc7df4797c238b5a71388eaffd51477d48d2a75070ae38a7bb989e6d';

  const receipt = await getUserOpReceipt({
    client: publicClient,
    hash,
  });

  console.log(receipt);
};

getUserOp();
