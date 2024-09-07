/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from '@/lib/prisma';
import * as erc20 from '@/lib/erc20';
import { Hex } from 'viem';

/**
 * ** Query get the transfer history and hence the balance **
 * WITH transfers_with_userdata AS (
	SELECT
		l. "from",
		from_user. "userId" AS "fromUserId",
		to_user. "userId" AS "toUserId",
		amount,
		"blockNumber",
		"txIndex"
	FROM
		"ERC20TransferLog" l
	LEFT JOIN "UserStealthAddress" from_user ON l. "from" = from_user.address
	LEFT JOIN "UserStealthAddress" to_user ON l. "to" = to_user.address
WHERE
	from_user != to_user -- Filter out the disguising transfers
)
SELECT
	sum(amount), "fromUserId", "toUserId"
FROM
	transfers_with_userdata
GROUP BY
	"blockNumber",
	"txIndex",
	"fromUserId",
	"toUserId"
 */

/**
 * Get the total USDC balance of all stealth addresses for a user
 */
const getBalance = async ({ userId }: { userId: number }) => {
  const addresses = await prisma.userStealthAddress.findMany({
    select: {
      address: true,
    },
    where: {
      userId,
    },
  });

  // TODO: Get the balance from the database by going through the transfers

  return BigInt(120000000);
};

export default getBalance;
