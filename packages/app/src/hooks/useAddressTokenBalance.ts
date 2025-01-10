import { Token } from '@raylac/shared';

import { TokenAmount } from '@raylac/shared';
import { Hex } from 'viem';
import useTokenBalancePerAddress from './useTokenBalancePerAddress';

type AddressTokenBalance = {
  totalBalance: TokenAmount;
  chainBalances: {
    chainId: number;
    balance: TokenAmount;
  }[];
};

/**
 * Get the multi-balance of a given token for a given address
 */
const useAddressTokenBalance = ({
  address,
  token,
}: {
  address: Hex | null;
  token: Token | null;
}): AddressTokenBalance | undefined => {
  // TODO: Make this faster
  const tokenBalances = useTokenBalancePerAddress({
    addresses: address ? [address] : [],
  });

  if (!token) {
    return undefined;
  }

  const tokenBalance = tokenBalances?.length
    ? tokenBalances[0].tokenBalances.find(tb => tb.token.id === token.id)
    : undefined;

  if (!tokenBalance) {
    return undefined;
  }

  return {
    totalBalance: tokenBalance.totalBalance,
    chainBalances: tokenBalance.chainBalances,
  };
};

export default useAddressTokenBalance;
