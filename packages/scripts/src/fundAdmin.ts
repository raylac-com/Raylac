import 'dotenv/config';
import {
  HDKey,
  hdKeyToAccount,
  privateKeyToAccount,
  publicKeyToAddress,
} from 'viem/accounts';
import * as bip39 from 'bip39';
import { HDAccount, Hex, parseUnits } from 'viem';
import {
  ERC20Abi,
  USDC_CONTRACT_ADDRESS,
  buildSiweMessage,
  generateStealthAddress,
  getStealthAddress,
} from '@sutori/shared';
import { publicClient, walletClient } from './viem';
import { client, getAuthedClient } from './rpc';

import { webcrypto } from 'node:crypto';
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const ADMIN_MNEMONIC = process.env.ADMIN_MNEMONIC;

if (!ADMIN_MNEMONIC) {
  throw new Error('ADMIN_MNEMONIC is not set');
}

const FUNDER_PRIV_KEY = process.env.FUNDER_PRIV_KEY;

if (!FUNDER_PRIV_KEY) {
  throw new Error('FUNDER_PRIV_KEY is not set');
}

const funderAccount = privateKeyToAccount(FUNDER_PRIV_KEY as Hex);

const signIn = async (adminSpendingAccount: HDAccount): Promise<string> => {
  const issuedAt = new Date();
  const message = buildSiweMessage({
    issuedAt,
    address: adminSpendingAccount.address,
    chainId: publicClient.chain.id,
  });

  const signature = await adminSpendingAccount.signMessage({
    message,
  });

  const result = await client.signIn.mutate({
    issuedAt: issuedAt.toISOString(),
    userSpendingPubKey: adminSpendingAccount.publicKey,
    signature,
  });

  return result.token;
};

const spawnAdminAccounts = async () => {
  const seed = bip39.mnemonicToSeedSync(ADMIN_MNEMONIC);
  const hdKey = HDKey.fromMasterSeed(seed);

  const spendingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  const viewingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 1,
  });

  const amounts = ['1'];

  for (const amount of amounts) {
    console.log(`Spawning admin account with ${amount} USDC`);

    const stealthAccount = generateStealthAddress({
      spendingPubKey: spendingAccount.publicKey,
      viewingPubKey: viewingAccount.publicKey,
    });

    const stealthSigner = publicKeyToAddress(stealthAccount.stealthPubKey);

    const stealthAddress = await getStealthAddress({
      client: publicClient,
      stealthSigner,
    });

    if (!stealthAddress) {
      throw new Error('Stealth account not found');
    }

    // Send from the main account

    // Send from the funder account
    const txHash = await walletClient.writeContract({
      account: funderAccount,
      abi: ERC20Abi,
      address: USDC_CONTRACT_ADDRESS,
      functionName: 'transfer',
      args: [stealthAddress, parseUnits(amount, 6)],
    });

    const token = await signIn(spendingAccount);

    const authedCient = getAuthedClient(token);

    await authedCient.addStealthAccount.mutate({
      address: stealthAddress,
      stealthPubKey: stealthAccount.stealthPubKey,
      ephemeralPubKey: stealthAccount.ephemeralPubKey,
      viewTag: stealthAccount.viewTag,
    });

    console.log('txHash', txHash);
  }
};

spawnAdminAccounts();
