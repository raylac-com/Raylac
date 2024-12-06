const getSwapHistoryMock = async () => {
  return [
    {
      amountOut: '100',
      amountIn: '100',
      usdAmountIn: '100',
      usdAmountOut: '100',
      tokenAddressIn: '0x0000000000000000000000000000000000000000',
      tokenAddressOut: '0x0000000000000000000000000000000000000000',
    },
  ];
};

export default getSwapHistoryMock;
