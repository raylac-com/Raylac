import { formatUnits, Hex, toHex } from 'viem';
import { getPublicClient } from '../../utils';
import {
  supportedChains,
  MultiChainTokenBalance,
  getERC20TokenBalance,
} from '@raylac/shared';
import {
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import getSupportedTokens from '../getSupportedTokens/getSupportedTokens';
import { base } from 'viem/chains';

const getETHBalance = async ({ address }: { address: Hex }) => {
  const client = getPublicClient({ chainId: base.id });
  const balance = await client.getBalance({ address });

  return balance;
};

/**
 * Get the balance of ERC20 tokens across all chains for a given address
 */
const getMultiChainERC20Balances = async ({
  address,
}: {
  address: Hex;
}): Promise<MultiChainTokenBalance[]> => {
  const supportedTokens = await getSupportedTokens(
    supportedChains.map(chain => chain.id)
  );

  const multiChainTokenBalances: MultiChainTokenBalance[] = await Promise.all(
    supportedTokens.map(async token => {
      const tokenBalance =
        token.symbol === 'ETH'
          ? await getETHBalance({ address })
          : await getERC20TokenBalance({
              address,
              contractAddress: token.addresses[0].address,
              chainId: token.addresses[0].chainId,
            });

      const tokenPrice =
        token.symbol === 'ETH'
          ? await getTokenPriceBySymbol('ETH')
          : await getTokenPriceByAddress({
              chainId: base.id,
              address: token.addresses[0].address,
            });

      const usdPrice = tokenPrice.prices.find(
        price => price.currency === 'usd'
      )?.value;

      const usdValue =
        tokenBalance && usdPrice
          ? Number(usdPrice) * Number(formatUnits(tokenBalance, token.decimals))
          : 0;

      const balance = tokenBalance;

      const multiChainTokenBalance: MultiChainTokenBalance = {
        name: token.name,
        symbol: token.symbol,
        logoUrl: token.logoURI,
        decimals: token.decimals,
        balance: toHex(balance),
        usdValue,
        tokenPrice: Number(usdPrice),
        breakdown: [
          {
            chainId: base.id,
            balance: toHex(balance),
            tokenAddress: token.addresses[0].address,
          },
        ],
      };

      return multiChainTokenBalance;
    })
  );

  return multiChainTokenBalances
    .filter(tokenBalance => tokenBalance.balance !== '0x0')
    .sort((a, b) => b.usdValue - a.usdValue);

  /*
  // Get token balances for each chain concurrently
  const alchemyTokenBalances = (
    await Promise.all(
      supportedChains.map(async chain =>
        getERC20TokenBalancesForChain({
          address: _address,
          chainId: chain.id,
        })
      )
    )
  ).flat();

  // Group known tokens into a single `MultiChainTokenBalance` object
  const multiChainTokenBalances: MultiChainTokenBalance[] = [];

  // Add balances for each known token
  for (const [token, { addresses, decimals }] of Object.entries(KNOWN_TOKENS)) {
    // Find all balances for this known token
    const knownTokenBalances = alchemyTokenBalances.filter(tokenBalance =>
      addresses.some(
        knownToken =>
          getAddress(tokenBalance.contractAddress) === knownToken.address &&
          tokenBalance.chainId === knownToken.chainId
      )
    );

    if (knownTokenBalances.length > 0) {
      // Sum the balances
      const balance = knownTokenBalances.reduce((acc, balance) => {
        return acc + BigInt(balance.tokenBalance ?? '0');
      }, 0n);

      multiChainTokenBalances.push({
        name: token,
        symbol: token,
        // Temporaory
        logoUrl:
          'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
        decimals,
        balance: toHex(balance),
        usdValue: Number(formatUnits(balance, decimals)), // USDC
        tokenPrice: 1,
        breakdown: knownTokenBalances.map(balance => ({
          chainId: balance.chainId,
          balance: toHex(balance.tokenBalance ?? '0'),
          tokenAddress: getAddress(balance.contractAddress),
        })),
      });
    }
  }

  // Add balances for the remaining tokens
  const promises = alchemyTokenBalances.map(async alchemyTokenBalance => {
    if (
      isKnownToken({
        tokenAddress: getAddress(alchemyTokenBalance.contractAddress),
        chainId: alchemyTokenBalance.chainId,
      })
    ) {
      return;
    }

    // Get the token metadata
    const alchemy = getAlchemyClient(alchemyTokenBalance.chainId);
    const tokenMetadata = await alchemy.core.getTokenMetadata(
      getAddress(alchemyTokenBalance.contractAddress)
    );

    if (!tokenMetadata.name || tokenMetadata.decimals === null) {
      return;
    }

    multiChainTokenBalances.push({
      name: tokenMetadata.name ?? '',
      symbol: tokenMetadata.symbol ?? '',
      logoUrl: tokenMetadata.logo ?? '',
      decimals: tokenMetadata.decimals,
      balance: toHex(alchemyTokenBalance.tokenBalance ?? '0'),
      usdValue: 0,
      tokenPrice: 1, // Temporary
      breakdown: [
        {
          chainId: alchemyTokenBalance.chainId,
          balance: toHex(alchemyTokenBalance.tokenBalance ?? '0'),
          tokenAddress: alchemyTokenBalance.contractAddress as Hex,
        },
      ],
    });
  });

  await Promise.all(promises);

  // Get the token prices
  const tokenPrices: AlchemyTokenPriceResponse[] = [];

  const batchSize = 25;

  for (let i = 0; i < multiChainTokenBalances.length; i += batchSize) {
    const tokenBalances = multiChainTokenBalances.slice(i, i + batchSize);

    const result = await getTokenPrices({
      tokenAddresses: tokenBalances.map(tokenBalance => ({
        address: tokenBalance.breakdown[0].tokenAddress,
        chainId: tokenBalance.breakdown[0].chainId,
      })),
    });

    tokenPrices.push(...result);
  }

  //Assign usd value to each token balance
  const withUsdValue: MultiChainTokenBalance[] = [];

  for (const tokenBalance of multiChainTokenBalances) {
    const tokenPrice = tokenPrices.find(
      price =>
        (price.network as Network) ===
          toAlchemyNetwork(tokenBalance.breakdown[0].chainId) &&
        price.address === tokenBalance.breakdown[0].tokenAddress
    );

    const usdPrice = tokenPrice?.prices.find(
      price => price.currency === 'usd'
    )?.value;

    if (usdPrice) {
      const usdValue =
        Number(
          formatUnits(
            hexToBigInt(tokenBalance.balance as Hex),
            tokenBalance.decimals
          )
        ) * Number(usdPrice);

      withUsdValue.push({
        ...tokenBalance,
        usdValue,
      });
    }
  }
    */
};

/**
 * Get the balance of ETH across all chains for a given address
 */
/*
const getMultiChainETHBalance = async ({
  address,
}: {
  address: Hex;
}): Promise<MultiChainTokenBalance> => {
  const balances = await Promise.all(
    supportedChains.map(async chain => {
      const client = getPublicClient({ chainId: chain.id });
      const balance = await client.getBalance({ address });

      return { balance, chainId: chain.id };
    })
  );

  const multiChainETHBalance = balances.reduce((acc, balance) => {
    return acc + balance.balance;
  }, 0n);

  const tokenPrice = await getTokenPriceBySymbol('ETH');

  const usdPrice = tokenPrice.prices.find(
    price => price.currency === 'usd'
  )?.value;

  if (!usdPrice) {
    throw new Error('Failed to get ETH price');
  }

  const usdValue = Number(usdPrice) * Number(formatEther(multiChainETHBalance));

  return {
    name: 'Ethereum',
    symbol: 'ETH',
    logoUrl:
      'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
    decimals: 18,
    balance: toHex(multiChainETHBalance),
    usdValue,
    tokenPrice: Number(usdPrice),
    breakdown: balances.map(balance => ({
      chainId: balance.chainId,
      balance: toHex(balance.balance),
      tokenAddress: '0x0000000000000000000000000000000000000000',
    })),
  };
};
*/

const getTokenBalances = async ({ address }: { address: Hex }) => {
  //  const ethBalance = await getMultiChainETHBalance({ address });
  const tokenBalances = await getMultiChainERC20Balances({ address });

  return [...tokenBalances];
};

export default getTokenBalances;
