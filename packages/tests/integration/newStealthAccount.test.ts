import { webcrypto } from 'node:crypto';
import 'dotenv/config';
import { describe, expect, test } from 'vitest';
import {
  ERC5564_ANNOUNCER_ADDRESS,
  getPublicClient,
  getViewingPrivKey,
  getSpendingPrivKey,
  recoveryStealthPrivKey,
  sleep,
  ERC5564_SCHEME_ID,
  decodeERC5564MetadataAsViewTag,
  supportedChains,
  ERC5564_ANNOUNCEMENT_CHAIN,
} from '@raylac/shared';
import { Hex, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TEST_ACCOUNT_MNEMONIC } from '../lib/auth';
import { createStealthAccountForTestUser } from '../lib/utils';

const ANNOUNCEMENT_CHAIN_ID = ERC5564_ANNOUNCEMENT_CHAIN.id;

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const pollAnnouncementLog = async (signerAddress: Hex) => {
  const publicClient = getPublicClient({
    chainId: ANNOUNCEMENT_CHAIN_ID,
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
    // Generate a new stealth address for the test user
    const newStealthAccount = await createStealthAccountForTestUser({
      syncOnChainIds: supportedChains.map(c => c.id),
      announcementChainId: ANNOUNCEMENT_CHAIN_ID,
    });

    // Poll for the announcement log
    const announcementLog = await pollAnnouncementLog(
      newStealthAccount.signerAddress
    );

    // Check that the announcement log is correct
    expect(announcementLog).toBeDefined();
    expect(announcementLog.args.ephemeralPubKey).toEqual(
      newStealthAccount.ephemeralPubKey
    );
    expect(announcementLog.args.stealthAddress).toEqual(
      newStealthAccount.signerAddress
    );

    const decodedMetadata = decodeERC5564MetadataAsViewTag(
      announcementLog.args.metadata as Hex
    );

    expect(decodedMetadata.viewTag).toEqual(newStealthAccount.viewTag);
    expect(
      decodedMetadata.chainInfos.map(chainInfo => chainInfo.chainId)
    ).toEqual(supportedChains.map(chain => chain.id));

    expect(announcementLog.args.schemeId).toEqual(ERC5564_SCHEME_ID);

    const spendingPrivKey = getSpendingPrivKey(TEST_ACCOUNT_MNEMONIC);
    const viewingPrivKey = getViewingPrivKey(TEST_ACCOUNT_MNEMONIC);

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
