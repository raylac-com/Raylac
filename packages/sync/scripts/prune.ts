import prisma from '../src/lib/prisma';

/**
 * Prune all synched data from the database
 */
const prune = async () => {
  await prisma.trace.deleteMany();
  await prisma.userOperation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.block.deleteMany();
  await prisma.syncStatus.deleteMany();
  await prisma.addressSyncStatus.deleteMany();
  await prisma.eRC5564Announcement.deleteMany();
  await prisma.userStealthAddress.deleteMany();
};

prune();
