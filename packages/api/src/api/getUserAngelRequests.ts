import prisma from '../lib/prisma';

/**
 * Get all angel requests made by a user
 */
const getUserAngelRequests = async ({ userId }: { userId: number }) => {
  const angelRequests = await prisma.angelRequest.findMany({
    select: {
      id: true,
      description: true,
      amount: true,
      paidBy: {
        select: {
          id: true,
          transactions: {
            select: {
              traces: {
                select: {
                  UserStealthAddressFrom: {
                    select: {
                      id: true,
                      user: {
                        select: {
                          id: true,
                          name: true,
                          username: true,
                          profileImage: true,
                        },
                      },
                    },
                  },
                  UserStealthAddressTo: {
                    select: {
                      id: true,
                      user: {
                        select: {
                          id: true,
                          name: true,
                          username: true,
                          profileImage: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return angelRequests;
};

export default getUserAngelRequests;
