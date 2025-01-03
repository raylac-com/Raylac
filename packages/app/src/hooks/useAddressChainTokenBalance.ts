import { Hex } from 'viem';
import useTokenBalances from './useTokenBalances';
import { getAddressChainTokenBalance, Token } from '@raylac/shared';

const useAddressChainTokenBalance = ({
  address,
  chainId,
  token,
}: {
  address: Hex;
  chainId: number;
  token: Token;
}) => {
  const { data: tokenBalances } = useTokenBalances();

  return tokenBalances
    ? getAddressChainTokenBalance({
        tokenBalances: tokenBalances,
        chainId,
        token,
        address,
      })
    : undefined;
};

export default useAddressChainTokenBalance;
