import { getAddress, Hex } from 'viem';
import { getPublicClient } from '../../utils';
import {
  supportedChains,
  TokenBalancesReturnType,
  Token,
  Balance,
  formatBalance,
  ETH,
} from '@raylac/shared';
import { getAlchemyClient } from '../../lib/alchemy';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';
import { getToken } from '../../lib/token';
import { OwnedToken } from 'alchemy-sdk';

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
  balance: Balance;
  chainId: number;
} | null> => {
  const token = await getToken({
    tokenAddress,
    chainId,
  });

  if (!token) {
    return null;
  }

  const tokenPriceUsd = await getTokenUsdPrice({
    token,
  });

  if (tokenPriceUsd === 'notfound') {
    return null;
  }

  const formattedBalance = formatBalance({
    balance: tokenBalance,
    token,
    tokenPriceUsd,
  });

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

  const ethTokenPriceUsd = await getTokenUsdPrice({ token: ETH });

  if (ethTokenPriceUsd === 'notfound') {
    throw new Error('ETH token price not found');
  }

  const formattedBalance = formatBalance({
    balance: ethBalance,
    token: ETH,
    tokenPriceUsd: ethTokenPriceUsd,
  });

  return formattedBalance;
};

const getTokenBalancesFromAlchemy = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}): Promise<OwnedToken[]> => {
  const alchemyClient = getAlchemyClient(chainId);

  const balances: OwnedToken[] = [];
  let pageKey: string | undefined = undefined;

  for (let i = 0; i < 10; i++) {
    const tokenBalances = await alchemyClient.core.getTokensForOwner(address, {
      pageKey,
    });

    balances.push(...tokenBalances.tokens);

    if (tokenBalances.pageKey) {
      pageKey = tokenBalances.pageKey;
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
    balance: Balance;
    chainId: number;
  }[]
> => {
  const tokenBalances = await Promise.all(
    supportedChains.map(async chain => {
      const alchemyTokenBalances = await getTokenBalancesFromAlchemy({
        address,
        chainId: chain.id,
      });

      const addressChainTokenBalances = (
        await Promise.all(
          alchemyTokenBalances.map(async token => {
            if (token.rawBalance === '0' || token.rawBalance === undefined) {
              return null;
            }

            return await formatAlchemyTokenBalance({
              address,
              tokenAddress: getAddress(token.contractAddress),
              tokenBalance: BigInt(token.rawBalance),
              chainId: chain.id,
            });
          })
        )
      ).filter(tokenBalance => tokenBalance !== null);

      const ethTokenBalance = await getFormattedETHBalance({
        address,
        chainId: chain.id,
      });

      if (ethTokenBalance.balance !== '0') {
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
