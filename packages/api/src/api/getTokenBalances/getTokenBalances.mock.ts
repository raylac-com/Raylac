import { TokenBalancesReturnType } from '@raylac/shared';
import { Hex } from 'viem';

const getTokenBalancesMock = async ({
  addresses: _addresses,
}: {
  addresses: Hex[];
}): Promise<TokenBalancesReturnType> => {
  return [];
};

export default getTokenBalancesMock;
