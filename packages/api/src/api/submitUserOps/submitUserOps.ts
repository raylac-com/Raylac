import {
  getChainName,
  getWebsocketClient,
  UserOperation,
} from '@raylac/shared';
import { handleOps } from '../../lib/bundler';
import { logger } from '@raylac/shared-backend';

const submitUserOpsForChain = async ({
  chainId,
  userOps,
}: {
  chainId: number;
  userOps: UserOperation[];
}) => {
  // Call the EntryPoint's `handleOps` function
  const { txHash } = await handleOps({ userOps, chainId });

  logger.info(`submitted tx ${txHash} on ${getChainName(chainId)}`);
  const websocketClient = getWebsocketClient({ chainId });

  const txReceipt = await websocketClient.waitForTransactionReceipt({
    hash: txHash,
  });

  return { chainId, ...txReceipt };
};

const submitUserOps = async (userOps: UserOperation[]) => {
  const chainIds = [...new Set(userOps.map(userOp => userOp.chainId))];

  const txReceipts = await Promise.all(
    chainIds.map(chainId =>
      submitUserOpsForChain({
        chainId,
        userOps: userOps.filter(userOp => userOp.chainId === chainId),
      })
    )
  );

  return txReceipts;
};

export default submitUserOps;
