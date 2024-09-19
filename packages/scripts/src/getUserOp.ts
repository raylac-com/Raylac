import 'dotenv/config';
import { getPublicClient, getUserOpReceipt } from '@raylac/shared';
import { arbitrumSepolia, baseSepolia } from 'viem/chains';

const getUserOp = async () => {
  const hash =
    //    '0x38180819964cce753fad66def22cafe6ae0cd434ec3d4bc5723543b1dd80e839';
    '0x3fbce0670229750dea937b0409cb313216a2ff4368a523388f5286c96b6ed807';

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
