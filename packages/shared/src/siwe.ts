import { Hex } from 'viem';
import { createSiweMessage } from 'viem/siwe';

export const buildSiweMessage = ({
  address,
  issuedAt,
  chainId,
}: {
  address: Hex;
  issuedAt: Date;
  chainId: number;
}) => {
  return createSiweMessage({
    issuedAt,
    address: address,
    domain: 'sutori.com',
    nonce: '0xdeadbeef',
    chainId,
    uri: 'https://sutori.com',
    version: '1',
  });
};
