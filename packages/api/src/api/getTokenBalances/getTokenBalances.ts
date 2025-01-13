import { getAddress, Hex, hexToBigInt } from 'viem';
import { getPublicClient } from '../../utils';
import {
  supportedChains,
  TokenBalancesReturnType,
  Token,
  TokenAmount,
  formatTokenAmount,
  ETH,
} from '@raylac/shared';
import { getAlchemyClient } from '../../lib/alchemy';
import getTokenPrice from '../getTokenPrice/getTokenPrice';
import { getToken } from '../../lib/token';
import { TokenBalancesResponseErc20, TokenBalanceType } from 'alchemy-sdk';
// import * as coingecko from '../../lib/coingecko';

export const getETHBalance = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });
  const balance = await client.getBalance({ address });

  return balance;
};

const formatAlchemyTokenBalance = async ({
  address,
  tokenAddress,
  tokenBalance,
  chainId,
}: {
  address: Hex;
  tokenAddress: Hex;
  tokenBalance: bigint;
  chainId: number;
}): Promise<{
  token: Token;
  address: Hex;
  balance: TokenAmount;
  chainId: number;
} | null> => {
  const token = await getToken({
    tokenAddress,
    chainId,
  });

  if (!token) {
    return null;
  }

  const tokenPriceUsd = await getTokenPrice({ token });

  if (!tokenPriceUsd) {
    return null;
  }

  const formattedBalance = formatTokenAmount({
    amount: tokenBalance,
    token,
    tokenPrice: {
      usd: tokenPriceUsd.toString(),
      jpy: '0',
    },
  });

  /*
  const coinData = await coingecko.getCoinData({
    tokenAddress,
    chainId,
  });

  if (!coinData) {
    return null;
  }

  const tokenPriceUsd = coinData.market_data.current_price.usd;
  const tokenPriceJpy = coinData.market_data.current_price.jpy;

  const formattedBalance = formatTokenAmount({
    amount: tokenBalance,
    token,
    tokenPrice: {
      usd: tokenPriceUsd.toString(),
      jpy: tokenPriceJpy.toString(),
    },
  });
  */

  return {
    address,
    token,
    balance: formattedBalance,
    chainId,
  };
};

const getFormattedETHBalance = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const ethBalance = await getETHBalance({ address, chainId });

  const ethTokenPriceUsd = await getTokenPrice({ token: ETH });

  if (ethTokenPriceUsd === null) {
    throw new Error('ETH token price not found');
  }

  const formattedBalance = formatTokenAmount({
    amount: ethBalance,
    token: ETH,
    tokenPrice: {
      usd: ethTokenPriceUsd.toString(),
      jpy: '0',
    },
  });

  return formattedBalance;
};

const getTokenBalancesFromAlchemy = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}): Promise<TokenBalancesResponseErc20['tokenBalances']> => {
  const alchemyClient = getAlchemyClient(chainId);

  const balances: TokenBalancesResponseErc20['tokenBalances'] = [];
  let pageKey: string | undefined = undefined;

  for (let i = 0; i < 10; i++) {
    const result: TokenBalancesResponseErc20 =
      await alchemyClient.core.getTokenBalances(address, {
        type: TokenBalanceType.ERC20,
        pageKey,
      });

    balances.push(...result.tokenBalances);

    if (result.pageKey) {
      pageKey = result.pageKey;
    } else {
      break;
    }
  }

  return balances;
};

/**
 * Get the balance of a token across all chains for a given address from Alchemy
 */
const getMultiChainTokenBalancesFromAlchemy = async ({
  address,
}: {
  address: Hex;
}): Promise<
  {
    address: Hex;
    token: Token;
    balance: TokenAmount;
    chainId: number;
  }[]
> => {
  const tokenBalances = await Promise.all(
    supportedChains.map(async chain => {
      const alchemyTokenBalancesPromise = getTokenBalancesFromAlchemy({
        address,
        chainId: chain.id,
      });

      const ethTokenBalancePromise = getFormattedETHBalance({
        address,
        chainId: chain.id,
      });

      const addressChainTokenBalances = (
        await Promise.all(
          (await alchemyTokenBalancesPromise).map(async token => {
            if (!token.tokenBalance) {
              return null;
            }

            const balance = hexToBigInt(token.tokenBalance as Hex);

            if (balance === BigInt(0)) {
              return null;
            }

            return await formatAlchemyTokenBalance({
              address,
              tokenAddress: getAddress(token.contractAddress),
              tokenBalance: balance,
              chainId: chain.id,
            });
          })
        )
      ).filter(tokenBalance => tokenBalance !== null);

      const ethTokenBalance = await ethTokenBalancePromise;

      if (ethTokenBalance.amount !== '0') {
        addressChainTokenBalances.push({
          token: ETH,
          address,
          balance: ethTokenBalance,
          chainId: chain.id,
        });
      }

      return addressChainTokenBalances;
    })
  );

  return tokenBalances.flat();
};

const getTokenBalances = async ({
  addresses,
}: {
  addresses: Hex[];
}): Promise<TokenBalancesReturnType> => {
  const tokenBalances = (
    await Promise.all(
      addresses.map(address =>
        getMultiChainTokenBalancesFromAlchemy({ address })
      )
    )
  ).flat();

  return tokenBalances;
};

export default getTokenBalances;
