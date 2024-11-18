import { Hex } from 'viem';
import {
  encodeERC5564Metadata,
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564_SCHEME_ID,
  ERC5564AnnouncerAbi,
  getPublicClient,
  getSenderAddressV2,
  getWalletClient,
  StealthAddressWithEphemeral,
} from '@raylac/shared';
import { privateKeyToAccount, nonceManager } from 'viem/accounts';
import { logger } from '@raylac/shared-backend';
import { base, arbitrum, optimism, scroll, polygon, anvil } from 'viem/chains';

const CHAIN_BLOCK_TIME: Record<number, number> = {
  [base.id]: 2000,
  [arbitrum.id]: 250,
  [optimism.id]: 2000,
  [scroll.id]: 3000,
  [polygon.id]: 2000,
  [anvil.id]: 250,
};

const ANNOUNCER_PRIVATE_KEY = process.env.ANNOUNCER_PRIVATE_KEY;

if (!ANNOUNCER_PRIVATE_KEY) {
  throw new Error('ANNOUNCER_PRIVATE_KEY is required');
}

const announcerAccount = privateKeyToAccount(ANNOUNCER_PRIVATE_KEY as Hex, {
  nonceManager,
});

const getChainBlockNumber = async ({ chainId }: { chainId: number }) => {
  const publicClient = getPublicClient({ chainId });
  return await publicClient.getBlockNumber();
};

const SCAN_PAST_BUFFER = 30 * 1000; // 30 seconds

/**
 * Announce a stealth address to the ERC5564 announcer contract.
 * @param stealthAccount - The stealth account to announce
 * @param syncOnChainIds - The chains the stealth account needs to be indexed on
 * @param announcementChainId - The chain to announce the stealth account on
 */
export const announce = async ({
  stealthAccount,
  syncOnChainIds,
  announcementChainId,
}: {
  stealthAccount: StealthAddressWithEphemeral;
  syncOnChainIds: number[];
  announcementChainId: number;
}) => {
  // Get the block number for all supported chains
  const chainInfos = await Promise.all(
    syncOnChainIds.map(async chainId => {
      const blockNumber = await getChainBlockNumber({ chainId });

      // eslint-disable-next-line security/detect-object-injection
      const blockTime = CHAIN_BLOCK_TIME[chainId];
      const scanPastBufferBlocks = Math.floor(SCAN_PAST_BUFFER / blockTime);

      const scanFromBlock =
        blockNumber - BigInt(scanPastBufferBlocks) > BigInt(0)
          ? blockNumber - BigInt(scanPastBufferBlocks)
          : BigInt(0);

      return {
        chainId,
        scanFromBlock,
      };
    })
  );

  const metadata = encodeERC5564Metadata({
    viewTag: stealthAccount.viewTag,
    chainInfo: chainInfos,
  });

  // Sanity check that the stealth account matches the ERC5564_SCHEME_ID version
  if (
    stealthAccount.address !==
    getSenderAddressV2({
      stealthSigner: stealthAccount.signerAddress,
    })
  ) {
    throw new Error(
      `Stealth account ${stealthAccount.address} does not match ERC5564_SCHEME_ID version ${ERC5564_SCHEME_ID}`
    );
  }

  const walletClient = getWalletClient({
    chainId: announcementChainId,
  });

  try {
    await walletClient.writeContract({
      account: announcerAccount,
      abi: ERC5564AnnouncerAbi,
      address: ERC5564_ANNOUNCER_ADDRESS,
      functionName: 'announce',
      args: [
        ERC5564_SCHEME_ID,
        stealthAccount.signerAddress,
        stealthAccount.ephemeralPubKey,
        metadata,
      ],
    });

    logger.debug('Announced stealth account', {
      stealthAccount,
      chainInfos,
    });
  } catch (_err) {
    logger.warn('Failed to announce stealth address', {
      stealthAccount,
      error: _err,
    });
  }
};
