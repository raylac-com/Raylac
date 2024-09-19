import 'dotenv/config';
import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  traceFilter,
  traceTransaction,
} from '@raylac/shared';
import { baseSepolia } from 'viem/chains';
import { toHex } from 'viem';

const trace = async () => {
  const txTraces = await traceTransaction({
    txHash:
      '0x14aef4afebcd1183f7a73615fe3ff006545833d8ed76667d48bc6e111f358217',
    chainId: baseSepolia.id,
  });

  for (const tx of txTraces) {
    console.log(tx, tx.traceAddress.join('_'));
  }

  console.log('---');

  const traces = await traceFilter({
    toAddress: '0xa44b58b931281c4ECa54272b553B806249de7fe7',
    fromBlock: toHex(ACCOUNT_IMPL_DEPLOYED_BLOCK[baseSepolia.id]),
    chainId: baseSepolia.id,
  });

  for (const t of traces) {
    console.log(t, t.traceAddress.join('_'));
  }
};

trace();
