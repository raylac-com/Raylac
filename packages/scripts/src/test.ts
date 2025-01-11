import { getERC20TokenBalance, getPublicClient } from '@raylac/shared';
import BigNumber from 'bignumber.js';
import { base } from 'viem/chains';

const test = async () => {
  const price = '3424.5';
  const usdAmount = '1234543';
  const amount = new BigNumber(usdAmount).dividedBy(price);

  const formatted = amount.toFormat();
  const str = amount.toFixed();

  console.log(formatted);
  console.log(str);
};

test();
