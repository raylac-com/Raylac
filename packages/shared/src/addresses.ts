import { getAddress } from 'viem';

export const ACCOUNT_IMPL_V2_ADDRESS =
  '0x0dE41E4cb54a3084433f2Ed6Dd75F65C07F35eDb';

export const ACCOUNT_FACTORY_V2_ADDRESS =
  '0x89AD10193430Bb3878B7FE3CCa6475C64e8bf923';

export const RAYLAC_PAYMASTER_V2_ADDRESS =
  '0x54d2734C661548985618221bFeFC5bD25aDB1E81';

export const ENTRY_POINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

// From https://docs.relay.link/resources/contract-addresses
export const RELAY_RECEIVER_ADDRESSES = [
  '0xa5f565650890fba1824ee0f21ebbbf660a179934',
  '0xa06e1351e2fd2d45b5d35633ca7ecf328684a109',
  '0x00000000aa467eba42a3d604b3d74d63b2b6c6cb',
].map(address => getAddress(address));
