import { publicClient } from './lib/viem';
import prisma from './lib/prisma';
import { sleep } from './lib/utils';
import { USDC_CONTRACT_ADDRESS } from '@raylac/shared';
import { Hex, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

// Address chunks

// We syne incoming transfers by listening to the logs emitted by the USDC contract.
// All outgoing transfers can be indexed by listening to the logs emitted by the mixing contract. We index them separately.

const BASE_BLOCK_TIME = 2; // seconds

const syncIncomingTransfers = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const userAddresses = await prisma.userStealthAddress.findMany({
      select: {
        userId: true,
        address: true,
      },
    });

    const logs = await publicClient.getLogs({
      event: parseAbiItem(
        'event Transfer(address indexed from, address indexed to, uint256 value)'
      ),
      address: USDC_CONTRACT_ADDRESS,
      args: {
        to: '0x0',
      },
    });

    // Get all transfers made to Raylac users
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
