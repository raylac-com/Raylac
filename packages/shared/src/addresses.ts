import { getAddress } from 'viem';

// From https://docs.relay.link/resources/contract-addresses
export const RELAY_RECEIVER_ADDRESSES = [
  '0xa5f565650890fba1824ee0f21ebbbf660a179934',
  '0xa06e1351e2fd2d45b5d35633ca7ecf328684a109',
  '0x00000000aa467eba42a3d604b3d74d63b2b6c6cb',
].map(address => getAddress(address));
