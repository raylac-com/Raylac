import { StealthTransferData } from '@sutori/shared';
import { Hex } from 'viem';

const send = async ({
  data,
  signatures,
}: {
  data: StealthTransferData;
  signatures: Hex[];
}) => {
  // Send the transaction to the blockchain

  // Call the Relayer contract to send all transfers in batch

  return 'ok';
};

export default send;
