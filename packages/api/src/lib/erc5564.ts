import { Hex } from 'viem';
import {
  anvil1,
  encodeERC5564Metadata,
  ERC5564_ANNOUNCEMENT_CHAIN,
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564_SCHEME_ID,
  ERC5564AnnouncerAbi,
  getPublicClient,
  getSenderAddressV2,
  getWalletClient,
  StealthAddressWithEphemeral,
  supportedChains,
} from '@raylac/shared';
import { privateKeyToAccount, nonceManager } from 'viem/accounts';
import { logger } from '@raylac/shared-backend';
import { CHAIN_BLOCK_TIME } from '@raylac/sync';

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

export const announce = async ({
  stealthAccount,
  useAnvil = false,
}: {
  stealthAccount: StealthAddressWithEphemeral;
  useAnvil?: boolean;
}) => {
  // Get the block number for all supported chains
  const chainInfos = await Promise.all(
    supportedChains.map(async chain => {
      const blockNumber = await getChainBlockNumber({ chainId: chain.id });

      const blockTime = CHAIN_BLOCK_TIME[chain.id];
      const scanPastBufferBlocks = Math.floor(SCAN_PAST_BUFFER / blockTime);

      return {
        chainId: chain.id,
        scanFromBlock: blockNumber - BigInt(scanPastBufferBlocks),
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
    chainId: useAnvil ? anvil1.id : ERC5564_ANNOUNCEMENT_CHAIN.id,
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
  } catch (_err) {
    logger.warn('Failed to announce stealth address', {
      stealthAccount,
      error: _err,
    });
  }
};
