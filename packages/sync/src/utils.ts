import * as winston from 'winston';
import { Prisma, SyncJob } from '@prisma/client';
import prisma from './lib/prisma';
import { Hex, parseAbiItem, ParseEventLogsReturnType } from 'viem';
import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  bigIntMin,
  ENTRY_POINT_ADDRESS,
  ERC20Abi,
  getPublicClient,
} from '@raylac/shared';

export const announcementAbiItem = parseAbiItem(
  'event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes viewTag, bytes ephemeralPubKey)'
);

export const getFromBlock = async ({
  chainId,
  job,
}: {
  chainId: number;
  job: SyncJob;
}) => {
  // eslint-disable-next-line security/detect-object-injection
  const raylacAccountDeployedBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

  if (!raylacAccountDeployedBlock) {
    throw new Error(
      `ACCOUNT_IMPL_DEPLOYED_BLOCK not found for chain ${chainId}`
    );
  }

  const jobStatus = await prisma.syncStatus.findFirst({
    select: {
      lastSyncedBlockNum: true,
    },
    where: {
      job,
      chainId,
    },
  });

  const latestSynchedBlock =
    jobStatus?.lastSyncedBlockNum ?? raylacAccountDeployedBlock;

  const client = getPublicClient({ chainId });

  const finalizedBlockNumber = await client.getBlock({
    blockTag: 'finalized',
  });

  if (finalizedBlockNumber.number === null) {
    throw new Error('Finalized block number is null');
  }

  const fromBlock = bigIntMin([
    latestSynchedBlock,
    finalizedBlockNumber.number,
  ]);

  return fromBlock;
};

/**
 * Get the latest synced block number for a sync job
 */
export const getLatestSynchedBlockForJob = async (
  chainId: number,
  job: SyncJob
): Promise<bigint | null> => {
  const syncJobStatus = await prisma.syncStatus.findFirst({
    select: {
      lastSyncedBlockNum: true,
    },
    where: {
      job,
      chainId,
    },
  });

  return syncJobStatus?.lastSyncedBlockNum ?? null;
};

/**
 * Save the latest synced block number for a sync job to the database.
 */
export const updateJobLatestSyncedBlock = async ({
  chainId,
  syncJob,
  blockNumber,
}: {
  chainId: number;
  syncJob: SyncJob;
  blockNumber: bigint;
}) => {
  const data = {
    lastSyncedBlockNum: blockNumber,
    chainId,
    job: syncJob,
  };

  await prisma.syncStatus.upsert({
    update: data,
    create: data,
    where: {
      chainId_job: {
        chainId,
        job: syncJob,
      },
    },
  });
};

export const getLatestBlockHeight = async (chainId: number) => {
  const block = await prisma.block.findFirst({
    where: {
      chainId,
    },
    orderBy: {
      number: 'desc',
    },
  });

  return block?.number;
};

export type ERC20TransferLogType = ParseEventLogsReturnType<
  typeof ERC20Abi,
  'Transfer',
  true
>[number];

export const getMinSynchedBlockForAddresses = async ({
  addresses,
  tokenId,
  chainId,
}: {
  addresses: Hex[];
  tokenId: string;
  chainId: number;
}) => {
  const addressSyncStatus = await prisma.addressSyncStatus.findMany({
    select: {
      address: true,
      blockNumber: true,
    },
    where: {
      address: {
        in: addresses,
      },
      chainId,
      tokenId,
    },
  });

  // eslint-disable-next-line security/detect-object-injection
  const defaultFromBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

  if (!defaultFromBlock) {
    throw new Error(`No default from block for chain ${chainId}`);
  }

  const minSynchedBlock = addresses
    .map(
      address =>
        addressSyncStatus.find(status => status.address === address)
          ?.blockNumber || defaultFromBlock
    )
    .sort((a, b) => (a > b ? 1 : -1))[0];

  return minSynchedBlock;
};

export const updateAddressesSyncStatus = async ({
  addresses,
  chainId,
  tokenId,
  blockNumber,
}: {
  addresses: Hex[];
  chainId: number;
  tokenId: string;
  blockNumber: bigint;
}) => {
  // Update sync status records for addresses that have one
  await prisma.addressSyncStatus.updateMany({
    data: {
      blockHash: '0x',
      blockNumber,
    },
    where: {
      address: {
        in: addresses,
      },
      chainId,
      tokenId,
    },
  });
};

export const upsertTransaction = async ({
  txHash,
  chainId,
}: {
  txHash: Hex;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });

  const txExists = await prisma.transaction.findUnique({
    where: {
      hash: txHash,
    },
  });

  if (txExists) {
    return;
  }

  const tx = await client.getTransactionReceipt({
    hash: txHash,
  });

  const block = await client.getBlock({
    blockNumber: tx.blockNumber,
  });

  const data: Prisma.TransactionCreateInput = {
    hash: txHash,
    fromAddress: tx.from,
    toAddress: tx.to,
    chainId,
    block: {
      connectOrCreate: {
        where: {
          hash: tx.blockHash,
        },
        create: {
          number: tx.blockNumber,
          hash: tx.blockHash,
          timestamp: block.timestamp,
          chainId,
        },
      },
    },
  };

  await prisma.transaction.upsert({
    create: data,
    update: data,
    where: {
      hash: txHash,
    },
  });
};

const DATADOG_API_KEY = process.env.DATADOG_API_KEY;

const SERVICE_NAME = 'raylac-sync';

const httpTransportOptions = {
  host: 'http-intake.logs.ap1.datadoghq.com',
  path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&service=${SERVICE_NAME}`,
  ssl: true,
};

const useDatadog = !!DATADOG_API_KEY;

if (useDatadog) {
  console.log('Sending logs to Datadog');
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  exitOnError: false,
  transports: useDatadog
    ? [
        new winston.transports.Http(httpTransportOptions),
        new winston.transports.Console(),
      ]
    : [new winston.transports.Console()],
});

export const getApproxChainBlockTime = async (
  chainId: number
): Promise<number> => {
  const client = getPublicClient({ chainId });
  const latestBlock = await client.getBlock({
    blockTag: 'latest',
  });

  const compareBlock = await client.getBlock({
    blockNumber: latestBlock.number - 10n,
  });

  const timeDiff = latestBlock.timestamp - compareBlock.timestamp;

  return Number(timeDiff) / 10;
};

export const getLatestSynchedBlock = async (chainId: number) => {
  const latestSyncedBlock = await prisma.block.findFirst({
    select: {
      number: true,
    },
    where: {
      chainId,
    },
    orderBy: {
      number: 'desc',
    },
  });

  return latestSyncedBlock?.number ?? null;
};

export const getAccountImplDeployedBlock = (chainId: number) => {
  // eslint-disable-next-line security/detect-object-injection
  const accountImplDeployedBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

  if (!accountImplDeployedBlock) {
    throw new Error(`No account impl deployed block for chain ${chainId}`);
  }

  return accountImplDeployedBlock;
};

export const IGNORE_ADDRESSES = new Set(
  [
    '0x4200000000000000000000000000000000000006', // WETH
    ENTRY_POINT_ADDRESS,
    '0xCABEc88bB5319E22c536651aad46a5C544882002',
    '0xaFb2F11478f6FA61E625CCA136b6dA4FCd275D3c',
    '0x5E73c5cF9422d6A59BF544Dc524965634E21974A',
    '0xAd8eEBEdb5dAb3aba36fCB018eeC92c425362e31',
    '0x84b02B4ceE53c7d9E9243d9e39432cA75a951f8a',
    '0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8',
    '0x6591918516BdB44E618C33ef1c834238d489334E',
    '0xbbE50f03585F0E44aAC6Bd7cb174520DE72480aC',
    '0xbBce75170aa57B6828816B56Db5EA24A91BCaC9e',
    '0xE4310545E143b6E44Aefa9A96F9aca44984CB1e0',
    '0xc86c5857b448d1892540ce279B451343EbFab948',
    '0x1984c070e64e561631A7E20Ea3c4CbF4eb198Da8',
    '0x2b467997ed30316A3705AD9DA42C06c9a37285bc',
    '0x854D44777720969c18eDe7778d1F110C85438eaA',
    '0x2cE3fB4EA6A849Cc49F68BDBeaA4912A920bDFd8',
    '0x54af39EBAB5D1370B6a74A0cE3134ad06e0cCCbc',
    '0x4a25D28d10B02BCF13a16068F56d167D8F96d093',
    '0x91DfDeC28A8C2D946d151dF2fF9c8Dbd543d822E',
    '0xf70da97812CB96acDF810712Aa562db8dfA3dbEF',
    '0x65061d355ae0359Ec801E047e40c76051833E78c',
    '0x1FEAa0A9B9DC555963fBfC0B2EB68dA17A68989B',
    '0xd52b1994E745c0eE5Bc7AD41414Da7d9E0815b66',
    '0xB5ddDD1478cF09a531Ff4cfcBfC9C8b9dA93340d',
    '0x19cEeAd7105607Cd444F5ad10dd51356436095a1',
    '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
    '0x2b434a2bdc2b598ffd80aa6cb57878e55e8117a2',
    '0xdfb5ac77db8780ae3e438004691aecf716c179e5',
    '0xe65ee32eb543fb3bba5fba389d312d4a880f1895',
    '0xfbd85a0c200b286ef2d7a08306113669013c39da',
    '0xc4a4e8ae10b82a954519ca2ecc9efc8f77819e86',
    '0xc38d8080600ac6ad454310864e04cbb87697078f',
    '0xaa2ed8d04d150a546e4de73b77795c5962d9f044',
    '0xd13b1e9e23a5dad59469eba197090fe7b5f15555',
    '0xe37e799d5077682fa0a244d46e5649f71457bd09',
    '0x6f03b3df22f0c57a4477eeac3a49c2bc4eae2206',
    '0x7882570840a97a490a37bd8db9e1ae39165bfbd6',
    '0x2b23a2a48ffcff2684255fce0de723a2ec76cafb',
    '0x0000a26b00c1f0df003000390027140000faa719',
    '0x382ffce2287252f930e1c8dc9328dac5bf282ba1',
    '0x12917ba0c3bf47c8bbdd4c96c42372dcd959b4d4',
    '0xb69a1055a9322b2127373ff3a123a9921c855e62',
    '0xc2815c2047a735b8a7b9d4c3034e90daf4c3e835',
    '0xad01c20d5886137e056775af56915de824c8fce5',
    '0x569866f5f20fc0a54ad779526674d301223f273c',
    '0xb5320b0b3a13cc860893e2bd79fcd7e13484dda2',
    '0x1111111254eeb25477b68fb85ed929f73a960582',
    '0xee935ed157d21e3d29d6e3940ed2daeffa49b9d6',
    '0x9d1478044f781ca722ff257e70d05e4ad673f443',
    '0x4be370c538471433cdb749d51e3540cb1c75ce6e',
    '0x1e9f4c1f51e0631912d701c203bd5cbac1677aa2',
    '0x623777cc098c6058a46cf7530f45150ff6a8459d',
    '0xf2614a233c7c3e7f08b1f887ba133a13f1eb2c55',
    '0x80c67432656d59144ceff962e8faf8926599bcf8',
    '0x0d5626ac29890a97dd094ae944c69e7df0f8c8ee',
    '0x5e809a85aa182a9921edd10a4163745bb3e36284',
    '0x3304e22ddaa22bcdc5fca2269b418046ae7b566a',
    '0xfc77eaac0ba6490939570798a4a5a1a53e8c068b',
    '0x009905bf008cca637185eeafe8f51bb56dd2aca7',
    '0x6cb442acf35158d5eda88fe602221b67b400be3e',
    '0xc24bb6f446d51a8cba48c12321da219276badb63',
    '0x24971b34b7d4e4c880983e4ebc015558af5ff7db',
    '0x5e6bb47d89fea09cf5a75ea7e3fa2e804798eb55',
    '0x00000000000007736e2f9aa5630b8c812e1f3fc9',
  ].map(address => address.toLowerCase())
);
