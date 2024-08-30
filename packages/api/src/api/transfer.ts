import { RegistryAbi } from '@sutori/shared';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';
import { walletClient } from '@/lib/viem';
import { Hex } from 'viem';

const NUM_MIXINS = 1;

const transfer = async ({
  from,
  to,
  signature,
  amount,
}: {
  from: Hex;
  to: Hex;
  signature: Hex;
  amount: bigint;
}) => {
  const mixinUsers: Pick<User, 'spendingPubKey'>[] = await prisma.$queryRaw`
    SELECT 'spendingPubKey' FROM "User"
    ORDER BY RANDOM()
    LIMIT ${NUM_MIXINS};
  `;

  // Load other user's spending address
  // Load the ones with balances
  // We need to keep track of the balances in the database

  // Generate stealth address

  const inputAddresses = [from];
  const outputAddresses = [to];

  const inputAddressBalance = 0n;
  // Get the latest balance of the spending user
  const change = inputAddressBalance - amount;
  const amounts = [change];

  const proof = '0x0';

  // Call the registry contract to transfer the funds
  await walletClient.writeContract({
    contract: RegistryAbi,
    abi: RegistryAbi,
    method: 'transfer',
    args: [inputAddresses, outputAddresses, amounts, signature, proof],
  });
};

export default transfer;
