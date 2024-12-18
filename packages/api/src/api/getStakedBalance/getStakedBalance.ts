import { getERC20TokenBalance } from '@raylac/shared';
import { Hex } from 'viem';
import { KNOWN_TOKENS } from '../../lib/knownTokes';

const getStakedBalance = async ({ address }: { address: Hex }) => {
  const wstToken = KNOWN_TOKENS.find(token => token.symbol === 'wstETH');

  if (!wstToken) {
    throw new Error('wstETH token not found');
  }

  const balances = await Promise.all(
    wstToken.addresses.map(async contractAddress => {
      const stakedBalance = await getERC20TokenBalance({
        address,
        contractAddress: contractAddress.address,
        chainId: contractAddress.chainId,
      });

      return {
        balance: stakedBalance.toString(),
        chain: contractAddress.chainId,
      };
    })
  );

  return balances;
};

export default getStakedBalance;
