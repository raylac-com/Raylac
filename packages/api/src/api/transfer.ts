/* eslint-disable @typescript-eslint/no-unused-vars */
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
  
};

export default transfer;
