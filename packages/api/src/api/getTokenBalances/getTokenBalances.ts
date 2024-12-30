import {
  formatUnits,
  getAddress,
  Hex,
  hexToBigInt,
  toHex,
  zeroAddress,
} from 'viem';
import { getPublicClient, getTokenMetadata } from '../../utils';
import {
  supportedChains,
  getERC20TokenBalance,
  TokenBalancesReturnType,
} from '@raylac/shared';
import {
  getAlchemyClient,
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import { KNOWN_TOKENS } from '@raylac/shared';
import BigNumber from 'bignumber.js';
import { logger } from '@raylac/shared-backend';
import getTokenPrice from '../getTokenPrice/getTokenPrice';

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

export const getKnownTokenBalances = async ({
  addresses,
}: {
  addresses: Hex[];
}): Promise<TokenBalancesReturnType> => {
  const balances = await Promise.all(
    KNOWN_TOKENS.map(async token => {
      const perAddressBreakdown = await Promise.all(
        // Get balances on each chain
        addresses.map(async address => {
          const addressBalanceBreakdown = await Promise.all(
            token.addresses.map(
              async ({ chainId, address: contractAddress }) => {
                const balance =
                  contractAddress === zeroAddress
                    ? await getETHBalance({ address, chainId })
                    : await getERC20TokenBalance({
                        address,
                        contractAddress,
                        chainId,
                      });

                return {
                  chainId,
                  tokenAddress: contractAddress,
                  balance,
                };
              }
            )
          );

          const totalBalance = addressBalanceBreakdown.reduce(
            (acc, curr) => acc + curr.balance,
            BigInt(0)
          );

          return {
            address,
            totalBalance,
            breakdown: addressBalanceBreakdown,
          };
        })
      );

      const totalBalance = perAddressBreakdown.reduce(
        (acc, curr) => acc + curr.totalBalance,
        BigInt(0)
      );

      if (totalBalance === BigInt(0)) {
        logger.info(`No balance found for known token ${token.symbol}`);
        return null;
      }

      const tokenPrice =
        token.symbol === 'ETH'
          ? await getTokenPriceBySymbol('ETH')
          : await getTokenPriceByAddress({
              chainId: token.addresses[0].chainId,
              address: token.addresses[0].address,
            });

      const usdPrice = tokenPrice.prices.find(
        price => price.currency === 'usd'
      )?.value;

      if (!usdPrice) {
        throw new Error(`USD price not found for known token ${token.symbol}`);
      }

      const usdValue = new BigNumber(usdPrice)
        .multipliedBy(new BigNumber(formatUnits(totalBalance, token.decimals)))
        .toString();

      const combinedBreakdown: TokenBalancesReturnType[number]['combinedBreakdown'] =
        [];

      const chains = new Set(
        perAddressBreakdown.flatMap(address =>
          address.breakdown.map(breakdown => breakdown.chainId)
        )
      );

      for (const chainId of chains) {
        const tokenAddressOnChain = token.addresses.find(
          address => address.chainId === chainId
        )?.address;

        if (!tokenAddressOnChain) {
          continue;
        }

        let combinedChainBalance = BigInt(0);

        for (const address of perAddressBreakdown) {
          const chainBalance = address.breakdown.find(
            breakdown => breakdown.chainId === chainId
          );

          if (chainBalance) {
            combinedChainBalance += chainBalance.balance;
          }
        }

        combinedBreakdown.push({
          chainId,
          balance: toHex(combinedChainBalance),
        });
      }

      const tokenBalance: TokenBalancesReturnType[number] = {
        token,
        balance: toHex(totalBalance),
        usdValue,
        tokenPrice: usdPrice,
        perAddressBreakdown: perAddressBreakdown.map(address => ({
          address: address.address,
          breakdown: address.breakdown.map(({ chainId, balance }) => ({
            chainId,
            balance: toHex(balance),
          })),
        })),
        combinedBreakdown,
      };

      return tokenBalance;
    })
  );

  return balances.filter(balance => balance !== null);
};

/**
 * Get the balance of ERC20 tokens across all chains for a given address
 */
const _getMultiChainERC20Balances = async ({
  address,
}: {
  address: Hex;
}): Promise<TokenBalancesReturnType> => {
  // Get addresses of all known tokens
  // We use this to filter out known tokens from the Alchemy response
  const knownTokenAddresses = KNOWN_TOKENS.map(token =>
    token.addresses.map(({ address }) => getAddress(address))
  ).flat();

  const _multiChainTokenBalances = await Promise.all(
    supportedChains.map(async chain => {
      const alchemyClient = getAlchemyClient(chain.id);

      // Get token balances on chain
      const tokenBalances = await alchemyClient.core.getTokenBalances(address);

      const tokensWithNonZeroBalances = tokenBalances.tokenBalances
        // Filter out known tokens
        .filter(
          tokenBalance =>
            !knownTokenAddresses.includes(
              getAddress(tokenBalance.contractAddress as Hex)
            )
        )
        // Filter out balances that are 0
        .filter(
          tokenBalance =>
            tokenBalance !== null &&
            hexToBigInt(tokenBalance.tokenBalance as Hex) !== BigInt(0)
        );

      const withMetadata = await Promise.all(
        tokensWithNonZeroBalances.map(async tokenBalance => {
          const tokenAddress = getAddress(tokenBalance.contractAddress);

          const metadata = await getTokenMetadata({
            tokenAddress,
            chainId: chain.id,
          });

          if (!metadata) {
            return null;
          }

          return { tokenBalance, tokenMetadata: metadata };
        })
      );

      const withUsdValue = await Promise.all(
        withMetadata
          .filter(token => token !== null)
          .map(async ({ tokenBalance, tokenMetadata }) => {
            // Get token price for the token
            const tokenPrice = await getTokenPrice({
              tokenAddress: tokenBalance.contractAddress as Hex,
              chainId: chain.id,
            });

            const usdPrice = tokenPrice.prices.find(
              price => price.currency === 'usd'
            )?.value;

            if (!usdPrice) {
              logger.info(
                `No USD price found for ${tokenBalance.contractAddress}`
              );
              return null;
            }

            // Calculate the USD value of the token
            const usdValue = new BigNumber(usdPrice)
              .multipliedBy(
                new BigNumber(
                  formatUnits(
                    hexToBigInt(tokenBalance.tokenBalance as Hex),
                    tokenMetadata.decimals!
                  )
                )
              )
              .toString();

            return {
              tokenBalance,
              tokenMetadata,
              usdValue,
              tokenPrice: usdPrice,
            };
          })
      );

      const multiChainTokenBalances = withUsdValue
        .filter(token => token !== null)
        .map(({ tokenBalance, tokenMetadata, usdValue, tokenPrice }) => {
          return {
            token: tokenMetadata,
            balance: tokenBalance.tokenBalance as Hex,
            usdValue,
            tokenPrice,
            breakdown: [
              {
                chainId: chain.id,
                balance: tokenBalance.tokenBalance as Hex,
                tokenAddress: tokenBalance.contractAddress as Hex,
                usdValue,
              },
            ],
          };
        });

      return multiChainTokenBalances;
    })
  );

  return [];
};

const getTokenBalances = async ({
  addresses,
}: {
  addresses: Hex[];
}): Promise<TokenBalancesReturnType> => {
  const knownTokenBalances = await getKnownTokenBalances({ addresses });
  /*
  const tokenBalances = await getMultiChainERC20Balances({
    addresses,
  });
  */

  const response: TokenBalancesReturnType = [
    ...knownTokenBalances,
    //...tokenBalances,
  ];

  return response.sort((a, b) =>
    new BigNumber(a.usdValue).gt(b.usdValue) ? -1 : 1
  );
};

export default getTokenBalances;
