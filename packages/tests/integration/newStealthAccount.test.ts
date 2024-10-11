import { webcrypto } from 'node:crypto';
import 'dotenv/config';
import { describe } from 'node:test';
import { expect, test } from 'vitest';
import { MNEMONIC, signInAsTestUser } from '../lib/auth';
import { getAuthedClient } from '../lib/rpc';
import {
  ERC5564_ANNOUNCEMENT_CHAIN,
  ERC5564_ANNOUNCER_ADDRESS,
  generateStealthAddress,
  getPublicClient,
  getViewingPrivKey,
  getSpendingPrivKey,
  recoveryStealthPrivKey,
  sleep,
  ERC5564_SCHEME_ID,
} from '@raylac/shared';
import { Hex, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const pollAnnouncementLog = async (signerAddress: Hex) => {
  const publicClient = getPublicClient({
    chainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
  });

  const timeoutMs = 15000;
  const startTime = Date.now();

  while (true) {
    const log = await publicClient.getLogs({
      event: parseAbiItem([
        'event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes ephemeralPubKey, bytes metadata)',
      ]),
      address: ERC5564_ANNOUNCER_ADDRESS,
      args: {
        stealthAddress: signerAddress,
      },
    });

    if (log.length > 0) {
      return log[0];
    }

    if (Date.now() - startTime > timeoutMs) {
      throw new Error('Timeout waiting for announcement log');
    }

    await sleep(1000);
  }
};

describe('new stealth account', () => {
  test('create and recover stealth account', async () => {
    const { token, userId } = await signInAsTestUser();

    const client = await getAuthedClient(token);

    const user = await client.getUser.query({
      userId,
    });

    if (!user) {
      throw new Error('User not found');
    }

    const newStealthAccount = generateStealthAddress({
      spendingPubKey: user.spendingPubKey as Hex,
      viewingPubKey: user.viewingPubKey as Hex,
    });

    await client.addStealthAccount.mutate({
      address: newStealthAccount.address,
      signerAddress: newStealthAccount.signerAddress,
      ephemeralPubKey: newStealthAccount.ephemeralPubKey,
      viewTag: newStealthAccount.viewTag,
      userId: user.id,
      label: '',
    });

    const announcementLog = await pollAnnouncementLog(
      newStealthAccount.signerAddress
    );

    expect(announcementLog).toBeDefined();
    expect(announcementLog.args.ephemeralPubKey).toEqual(
      newStealthAccount.ephemeralPubKey
    );
    expect(announcementLog.args.stealthAddress).toEqual(
      newStealthAccount.signerAddress
    );
    expect(announcementLog.args.metadata).toEqual(newStealthAccount.viewTag);
    expect(announcementLog.args.schemeId).toEqual(ERC5564_SCHEME_ID);

    const spendingPrivKey = getSpendingPrivKey(MNEMONIC);
    const viewingPrivKey = getViewingPrivKey(MNEMONIC);

    // Check that we can recover the stealth address private key from the announcement log
    const stealthAddressPrivateKey = recoveryStealthPrivKey({
      ephemeralPubKey: announcementLog.args.ephemeralPubKey as Hex,
      spendingPrivKey,
      viewingPrivKey,
    });

    const recoveredStealthAddress = privateKeyToAccount(
      stealthAddressPrivateKey
    ).address;

    expect(recoveredStealthAddress).toEqual(newStealthAccount.signerAddress);
  });
});
