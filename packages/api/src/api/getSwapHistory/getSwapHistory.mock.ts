import { base, optimism } from 'viem/chains';

const getSwapHistoryMock = async () => {
  return [
    {
      amountOut: '100',
      amountIn: '100',
      usdAmountIn: '100',
      usdAmountOut: '100',
      tokenAddressIn: '0x0000000000000000000000000000000000000000',
      tokenAddressOut: '0x0000000000000000000000000000000000000000',
      transactions: [
        {
          hash: '0x123',
          chainId: base.id as number,
        },
      ],
    },
    {
      amountOut: '300',
      amountIn: '300',
      usdAmountIn: '300',
      usdAmountOut: '300',
      tokenAddressIn: '0x0000000000000000000000000000000000000000',
      tokenAddressOut: '0x0000000000000000000000000000000000000000',
      transactions: [
        {
          hash: '0x123',
          chainId: optimism.id as number,
        },
      ],
    },
  ];
};

export default getSwapHistoryMock;
