import { Token } from '@raylac/shared';
import { Hex, zeroAddress } from 'viem';
import { base } from 'viem/op-stack';

const getTokenMock = async (_args: { tokenAddress: Hex }): Promise<Token> => {
  return {
    symbol: 'ETH',
    name: 'Ethereum',
    verified: true,
    addresses: [
      {
        chainId: base.id,
        address: zeroAddress,
      },
    ],
    decimals: 18,
    logoURI:
      'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
  };
};

export default getTokenMock;
