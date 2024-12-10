import {
  formatUnits,
  getAddress,
  Hex,
  hexToBigInt,
  toHex,
  zeroAddress,
} from 'viem';
import { getPublicClient } from '../../utils';
import {
  supportedChains,
  getERC20TokenBalance,
  RelaySupportedCurrenciesResponseBody,
  TokenBalancesReturnType,
} from '@raylac/shared';
import {
  getAlchemyClient,
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import { KNOWN_TOKENS } from '../../lib/knownTokes';
import { relayApi } from '../../lib/relay';
import BigNumber from 'bignumber.js';
import { logger } from '@raylac/shared-backend';

const getETHBalance = async ({
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

const getKnownTokenBalances = async ({
  address,
}: {
  address: Hex;
}): Promise<TokenBalancesReturnType> => {
  const balances = await Promise.all(
    KNOWN_TOKENS.map(async token => {
      const multiChainBalances = await Promise.all(
        // Get balances on each chain
        token.addresses.map(async ({ chainId, address: contractAddress }) => {
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
        })
      );

      const totalBalance = multiChainBalances.reduce(
        (acc, curr) => acc + curr.balance,
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

      const tokenBalance: TokenBalancesReturnType[number] = {
        token,
        balance: toHex(totalBalance),
        usdValue,
        tokenPrice: usdPrice,
        breakdown: multiChainBalances
          .filter(balance => balance.balance !== BigInt(0))
          .sort((a, b) => (b.balance > a.balance ? 1 : -1))
          .map(({ chainId, tokenAddress, balance }) => ({
            chainId,
            tokenAddress,
            balance: toHex(balance),
            usdValue: new BigNumber(usdPrice)
              .multipliedBy(new BigNumber(formatUnits(balance, token.decimals)))
              .toString(),
          })),
      };

      return tokenBalance;
    })
  );

  return balances.filter(balance => balance !== null);
};

/**
 * Get the balance of ERC20 tokens across all chains for a given address
 */
const getMultiChainERC20Balances = async ({
  address,
}: {
  address: Hex;
}): Promise<TokenBalancesReturnType> => {
  // Get addresses of all known tokens
  // We use this to filter out known tokens from the Alchemy response
  const knownTokenAddresses = KNOWN_TOKENS.map(token =>
    token.addresses.map(({ address }) => getAddress(address))
  ).flat();

  const multiChainTokenBalances = await Promise.all(
    supportedChains.map(async chain => {
      const alchemyClient = getAlchemyClient(chain.id);

      // Get token balances on chain
      const tokenBalances = await alchemyClient.core.getTokenBalances(address);

      // Get token metadata for each balance
      const withMetadata = await Promise.all(
        tokenBalances.tokenBalances
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
          )
          // Get token metadata for each token
          .map(async tokenBalance => {
            const result =
              await relayApi.post<RelaySupportedCurrenciesResponseBody>(
                'currencies/v1',
                {
                  chainIds: [chain.id],
                  address: tokenBalance.contractAddress,
                  useExternalSearch: true,
                }
              );

            const tokenMetadata =
              result.data.length > 0 ? result.data[0][0] : null;

            if (!tokenMetadata) {
              logger.error(
                `No token metadata found for ${tokenBalance.contractAddress}`
              );
              return null;
            }

            return {
              chainId: chain.id,
              tokenBalance,
              tokenMetadata,
            };
          })
      );

      const withUsdValue = await Promise.all(
        withMetadata
          .filter(token => token !== null)
          .map(async ({ tokenBalance, tokenMetadata }) => {
            // Get token price for the token
            const tokenPrice = await getTokenPriceByAddress({
              chainId: chain.id,
              address: tokenBalance.contractAddress as Hex,
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

      const multiChainTokenBalances: TokenBalancesReturnType = withUsdValue
        .filter(token => token !== null)
        .map(({ tokenBalance, tokenMetadata, usdValue, tokenPrice }) => {
          return {
            token: {
              name: tokenMetadata.name,
              symbol: tokenMetadata.symbol,
              logoURI: tokenMetadata.metadata.logoURI,
              decimals: tokenMetadata.decimals,
              verified: tokenMetadata.metadata.verified,
              addresses: [
                {
                  chainId: chain.id,
                  address: tokenBalance.contractAddress as Hex,
                },
              ],
            },
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

  return multiChainTokenBalances.flat();
};

const getTokenBalances = async ({ address }: { address: Hex }) => {
  const knownTokenBalances = await getKnownTokenBalances({ address });
  const tokenBalances = await getMultiChainERC20Balances({ address });

  return [...knownTokenBalances, ...tokenBalances];
};

export default getTokenBalances;
