import 'dotenv/config';
import { getPublicClient, getUserOpReceipt } from '@raylac/shared';
import { baseSepolia } from 'viem/chains';

const getUserOp = async () => {
  const hash =
    '0x9667bf3041090ae7c159184cbbd8a2f86b9799a08d6060dbd4aa14ced9d086f7';

  const client = getPublicClient({
    chainId: baseSepolia.id,
  });

  const receipt = await getUserOpReceipt({
    client,
    hash,
  });

  console.log(receipt);
};

getUserOp();
