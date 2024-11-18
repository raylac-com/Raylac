import syncBlocks from './manageReorgs';
import syncNativeTransfers from './syncNativeTransfers';
import syncERC20Transfers from './syncERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
// import { announceStealthAccounts } from './announceStealthAccounts';
import checkAddressBalances from './checkAddressBalances';
import assignNativeTransfers from './assignNativeTransfers';
import syncUserOps from './syncUserOps';
import syncUserActions from './syncUserActions';
import { anvil } from 'viem/chains';
import {
  devChains,
  ERC5564_ANNOUNCEMENT_CHAIN,
  supportedChains,
} from '@raylac/shared';
import { spawn } from 'child_process';
import { logger } from '@raylac/shared-backend';

const runAnvil =
  process.env.RENDER !== 'true' || process.env.IS_PULL_REQUEST === 'true';

/**
 * Spawn an anvil instance as a child process.
 * *NOTE: This function doesn't throw even if the anvil process is already running and the port is already in use. The caller
 * * should use the existing anvil instance if it exists.
 */
const startAnvil = ({ port, chainId }: { port: number; chainId: number }) => {
  const anvil = spawn(
    'anvil',
    [
      '--base-fee',
      '10000',
      '--port',
      port.toString(),
      '--chain-id',
      chainId.toString(),
    ],
    {
      detached: false, // The child process is not detached from the parent
    }
  );

  // Listen for the process's output (optional if stdio is not 'inherit')
  anvil.stdout.on('data', data => {
    logger.debug(`anvil: ${data}`);
  });

  anvil.stderr.on('error', data => {
    logger.error(`anvil error: ${data}`);
  });

  // Handle process exit
  anvil.on('close', code => {
    logger.info(`anvil exited with code ${code}`);
  });
};

const sync = async () => {
  const chainIds = supportedChains.map(chain => chain.id);

  const jobs = [
    syncBlocks({ chainIds }),
    syncUserOps({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
      chainIds,
    }),
    syncUserActions({ chainIds }),
    syncNativeTransfers({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
      chainIds,
    }),
    syncAnnouncements({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
    }),
    assignNativeTransfers({ chainIds }),
    syncERC20Transfers({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
      chainIds,
    }),
    checkAddressBalances({ chainIds }),
    scanStealthAddresses(),
  ];

  if (runAnvil) {
    logger.info('ANVIL_RPC_URL is set, running and indexing anvil nodes');
    for (const chain of devChains) {
      startAnvil({ port: chain.port, chainId: chain.id });
    }

    const devChainIds = devChains.map(chain => chain.id);
    const DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID = anvil.id;

    const devChainJobs = [
      syncBlocks({ chainIds: devChainIds }),
      syncUserOps({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
        chainIds: devChainIds,
      }),
      syncUserActions({ chainIds: devChainIds }),
      syncNativeTransfers({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
        chainIds: devChainIds,
      }),
      syncAnnouncements({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
      }),
      assignNativeTransfers({ chainIds: devChainIds }),
      syncERC20Transfers({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
        chainIds: devChainIds,
      }),
      checkAddressBalances({ chainIds: devChainIds }),
      scanStealthAddresses(),
    ];

    jobs.push(...devChainJobs);
  }

  await Promise.all(jobs);
};

export default sync;
