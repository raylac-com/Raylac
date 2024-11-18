import { Prisma } from '@raylac/db';

const selectTransfer = {
  id: true,
  timestamp: true,
  transactions: {
    select: {
      chainId: true,
      block: {
        select: {
          number: true,
          timestamp: true,
        },
      },
      traces: {
        select: {
          tokenId: true,
          chainId: true,
          traceAddress: true,
          tokenPriceAtTrace: true,
          logIndex: true,
          UserStealthAddressFrom: {
            select: {
              userId: true,
              address: true,
              user: {
                select: {
                  spendingPubKey: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
          UserStealthAddressTo: {
            select: {
              userId: true,
              address: true,
              user: {
                select: {
                  spendingPubKey: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
          from: true,
          to: true,
          amount: true,
          transactionHash: true,
        },
      },
      hash: true,
    },
  },
} satisfies Prisma.UserActionSelect;

export type TransferQueryResult = Prisma.UserActionGetPayload<{
  select: typeof selectTransfer;
}>;

export default selectTransfer;
