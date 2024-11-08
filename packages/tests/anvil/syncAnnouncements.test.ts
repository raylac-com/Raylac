import { describe, expect, it } from 'vitest';
import sync from '../../sync/src/sync';
import { anvil } from 'viem/chains';
import { createStealthAccountForTestUser } from '../lib/utils';
import prisma from '../lib/prisma';
import { StealthAddressWithEphemeral } from '@raylac/shared';

describe('syncAnnouncements', () => {
  it('should backfill announcements', async () => {
    const NUM_STEALTH_ADDRESSES = 10;

    // 1: Create multiple stealth addresses for testing

    const stealthAccounts: StealthAddressWithEphemeral[] = [];
    for (let i = 0; i < NUM_STEALTH_ADDRESSES; i++) {
      const account = await createStealthAccountForTestUser();
      stealthAccounts.push(account);
    }

    // 2: Sync the announcements

    await sync({ chainIds: [anvil.id] });

    // 3. Check that the announcements were indexed

    const announcements = await prisma.eRC5564Announcement.findMany({
      where: {
        address: {
          in: stealthAccounts.map(account => account.address),
        },
      },
    });

    expect(announcements.length).toBe(NUM_STEALTH_ADDRESSES);
  });
});
