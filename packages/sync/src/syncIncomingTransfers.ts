import { publicClient } from './lib/viem';
import prisma from './lib/prisma';
import { sleep } from './lib/utils';
import { USDC_CONTRACT_ADDRESS } from '@sutori/shared';
import { Hex } from 'viem';
import { base } from 'viem/chains';

// Address chunks

const syncIncomingTransfers = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const toBlock = await publicClient.getBlockNumber();

    const logs = await publicClient.getLogs({
      address: USDC_CONTRACT_ADDRESS,
      toBlock,
    });

    const userAddresses = await prisma.userStealthAddress.findMany({
      select: {
        userId: true,
        address: true,
      },
      orderBy: {
        lastSyncedBlockNum: 'asc',
      },
    });

    // Get all transfers made to Sutori users
    // We index all transfers made from Sutori users from the logs
    // emitted by the mixing contract.
    const sutoriUserTransfers = logs.filter(log =>
      userAddresses.some(address => address.address === log.topics[2])
    );

    const data = sutoriUserTransfers
      .map(log => {
        const fromAddress = log.topics[1] as Hex;
        const toAddress = log.topics[2] as Hex;

        // Get the userId of the "from" address of the transfer
        const toUserId = userAddresses.find(
          address => address.address === toAddress
        )?.userId;

        if (toUserId == undefined) {
          console.error("Couldn't find userId for address", toAddress);
          return null;
        }

        return {
          tokenId: 1,
          fromAddress,
          toAddress,
          amount: BigInt(log.topics[3] as Hex),
          toUserId,
          blockNumber: log.blockNumber,
          txIndex: log.transactionIndex,
          logIndex: log.logIndex,
          chainId: base.id,
        };
      })
      .filter(item => item !== null);

    await prisma.incomingTransfer.createMany({
      data,
    });

    await sleep(1000);
  }
};

export default syncIncomingTransfers;
