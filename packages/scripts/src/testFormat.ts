import { formatUsdValue } from '@raylac/shared';
import BigNumber from 'bignumber.js';

const testFormat = () => {
  const test = [
    '1000000',
    '100.0001',
    '100.243434',
    '0.1',
    '0.01',
    '0.01955',
    '0.000195',
    '0.015',
    '0.0003234253232',
    '0.1345555553334',
    '0.13',
  ];
  for (const num of test) {
    // console.log(num, formatUsdValue(new BigNumber(num)));
    console.log(num, new BigNumber(num).toPrecision(3).replace(/\.?0+$/, ''));
  }
};

testFormat();
