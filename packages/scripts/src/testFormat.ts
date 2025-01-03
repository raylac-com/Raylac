import { formatAmount, formatUsdValue } from '@raylac/shared';
import BigNumber from 'bignumber.js';
import { formatEther, parseEther } from 'viem';

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
    '0.000000000123453535',
    '0.13',
  ];
  for (const num of test) {
    console.log(num, `${formatUsdValue(new BigNumber(num))}`);
  }

  const testAmount = [
    parseEther('0.000000000123453535'),
    parseEther('0.0000000001234000535'),
    parseEther('123.000012'),
    parseEther('123'),
    parseEther('123.000000000000000000'),
  ];

  console.log('\n ETH');
  for (const num of testAmount) {
    console.log(num, formatEther(num), `${formatAmount(num.toString(), 18)}`);
  }
};

testFormat();
