import { getERC20TokenBalance, getPublicClient } from '@raylac/shared';
import { base } from 'viem/chains';

const test = async () => {
  const balance = await getERC20TokenBalance({
    address: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
    contractAddress: '0xd968196fa6977c4e58f2af5ac01c655ea8332d22',
    chainId: base.id,
  });

  console.log(balance);
};

test();
