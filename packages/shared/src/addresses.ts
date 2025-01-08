import { getAddress } from 'viem';

// From https://docs.relay.link/resources/contract-addresses

export const RELAY_RECEIVER_ADDRESSES = [
  '0xa5f565650890fba1824ee0f21ebbbf660a179934',
  '0xa06e1351e2fd2d45b5d35633ca7ecf328684a109',
  '0x00000000aa467eba42a3d604b3d74d63b2b6c6cb',
].map(address => getAddress(address));

export const RELAY_ERC20_ROUTER_ADDRESSES = [
  '0xa1bea5fe917450041748dbbbe7e9ac57a4bbebab',
  '0xe0b062d028236fa09fe33db8019ffeeee6bf79ed',
].map(address => getAddress(address));
