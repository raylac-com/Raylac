import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const RELAYER_PRIV_KEY = process.env.RELAYER_PRIV_KEY;

if (!RELAYER_PRIV_KEY) {
  throw new Error('RELAYER_PRIV_KEY is required');
}

const relayerAccount = privateKeyToAccount(RELAYER_PRIV_KEY as Hex);

export default relayerAccount;
