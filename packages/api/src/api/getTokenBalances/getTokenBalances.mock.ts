import { Hex } from 'viem';
import { TokenBalancesReturnType } from '@raylac/shared';

const getTokenBalances = async ({
  address: _address,
}: {
  address: Hex;
}): Promise<TokenBalancesReturnType> => {
  return [];
};

export default getTokenBalances;
