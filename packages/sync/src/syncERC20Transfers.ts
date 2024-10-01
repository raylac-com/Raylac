import { getPublicClient } from '@raylac/shared';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { Hex, parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import { sleep } from './lib/utils';

/**
 * TBD
 */
const syncERC20TransfersForAddresses = async (addresses: Hex[]) => {
  for (const token of supportedTokens.filter(
    token => token.tokenId !== 'eth'
  )) {
    for (const tokenAddress of token.addresses) {
      const publicClient = getPublicClient({
        chainId: tokenAddress.chain.id,
      });

      console.log(
        `Syncing transfers for ${token.tokenId} on ${tokenAddress.chain.id}`
      );
      const logs = await publicClient.getLogs({
        address: tokenAddress.address,
        event: parseAbiItem(
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ),
        args: {
          to: addresses,
        },
        fromBlock: BigInt(20055890),
        toBlock: 'latest',
      });

      console.log(addresses);
      console.log(logs);
    }
  }
};

const syncERC20Transfers = async () => {
  while (true) {
    const addresses = await prisma.userStealthAddress.findMany({
      select: { address: true },
      where: {
        address: '0x65495c80a882F0AD62647f48038630ee6f6E2801',
      },
    });

    // Sync incoming transfers in 100 address batches
    for (let i = 0; i < addresses.length; i += 100) {
      const batch = addresses
        .slice(i, i + 100)
        .map(({ address }) => address as Hex);

      await syncERC20TransfersForAddresses(batch);
    }

    await sleep(10000); // Sleep for 10 seconds
  }
};

export default syncERC20Transfers;
