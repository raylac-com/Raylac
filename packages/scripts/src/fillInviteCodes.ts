import 'dotenv/config';
import { nanoid } from 'nanoid';
import prisma from './lib/prisma';

const NUM_CODES = 10;

/**
 * Generate and fill the invite codes to the Postgres database.
 */
const fillInviteCodes = async () => {
  const inviteCodes = [];
  for (let i = 0; i < NUM_CODES; i++) {
    const inviteCode = nanoid(21);

    inviteCodes.push({
      inviteCode,
      isUsed: false,
    });
  }

  await prisma.inviteCode.createMany({
    data: inviteCodes,
  });
};
fillInviteCodes();
