import { getAddress, Hex, hexToBigInt } from 'viem';
import { getPublicClient } from '../../utils';
import {
  supportedChains,
  TokenBalancesReturnType,
  Token,
  Balance,
  formatBalance,
} from '@raylac/shared';
import { getAlchemyClient } from '../../lib/alchemy';
import { logger } from '@raylac/shared-backend';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';
import getToken from '../getToken/getToken';

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
}> => {
  const token = await getToken({
    tokenAddress,
    chainId,
  });

  const tokenPriceUsd = await getTokenUsdPrice({
    token,
  });

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
      const alchemyClient = getAlchemyClient(chain.id);

      const alchemyTokenBalances =
        await alchemyClient.core.getTokensForOwner(address);

      const addressChainTokenBalances = (
        await Promise.all(
          alchemyTokenBalances.tokens.map(async token => {
            try {
              // If we fail to get the token metadata from Relay or the token price, we'll fail to get the token balance
              // we'll remove the token from the response
              return await formatAlchemyTokenBalance({
                address,
                tokenAddress: getAddress(token.contractAddress),
                tokenBalance: hexToBigInt(token.rawBalance as Hex),
                chainId: chain.id,
              });
            } catch (error) {
              logger.error(error);
              return null;
            }
          })
        )
      ).filter(tokenBalance => tokenBalance !== null);

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
