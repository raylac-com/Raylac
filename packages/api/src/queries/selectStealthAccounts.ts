import { Prisma } from '@prisma/client';

const selectStealthAccounts = {
  address: true,
  signerAddress: true,
  viewTag: true,
  ephemeralPubKey: true,
  label: true,
  userOps: {
    select: {
      nonce: true,
      chainId: true,
      success: true,
    },
    orderBy: {
      nonce: 'desc',
    },
  },
} satisfies Prisma.UserStealthAddressSelect;

export type StealthAccountQueryResult = Prisma.UserStealthAddressGetPayload<{
  select: typeof selectStealthAccounts;
}>;

export default selectStealthAccounts;
