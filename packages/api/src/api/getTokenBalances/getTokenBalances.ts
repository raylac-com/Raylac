import {
  formatEther,
  formatUnits,
  getAddress,
  Hex,
  hexToBigInt,
  toHex,
} from 'viem';
import { getPublicClient, toAlchemyNetwork } from '../../utils';
import {
  supportedChains,
  MultiChainTokenBalance,
  AlchemyTokenPriceResponse,
} from '@raylac/shared';
import { Network, TokenBalance } from 'alchemy-sdk';
import { KNOWN_TOKENS } from '../../lib/knownTokes';
import {
  getAlchemyClient,
  getTokenPriceBySymbol,
  getTokenPrices,
} from '../../lib/alchemy';

/**
 * Get the balance of ERC20 tokens for a given address on a specific chain
 * @returns Array of MultiChainTokenBalance for the given address on the given chain
 */
const getERC20TokenBalancesForChain = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}): Promise<Array<TokenBalance & { chainId: number }>> => {
  const alchemy = getAlchemyClient(chainId);

  // Get token balances
  const tokenBalances = await alchemy.core.getTokenBalances(address);

  return tokenBalances.tokenBalances
    .map(balance => ({
      ...balance,
      chainId,
    }))
    .filter(
      balance =>
        hexToBigInt((balance.tokenBalance as Hex) ?? '0x0') !== BigInt(0)
    );
};

const isKnownToken = ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}) => {
  return Object.values(KNOWN_TOKENS).some(({ addresses }) =>
    addresses.some(
      knownToken =>
        knownToken.address === tokenAddress && knownToken.chainId === chainId
    )
  );
};

/**
 * Get the balance of ERC20 tokens across all chains for a given address
 */
const getMultiChainERC20Balances = async ({
  address: _address,
}: {
  address: Hex;
}): Promise<MultiChainTokenBalance[]> => {
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

  return withUsdValue;
};

/**
 * Get the balance of ETH across all chains for a given address
 */
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

  const usdPrice = tokenPrice?.[0].prices.find(
    price => price.currency === 'usd'
  )?.value;

  const usdValue = usdPrice
    ? Number(usdPrice) * Number(formatEther(multiChainETHBalance))
    : undefined;

  return {
    name: 'Ethereum',
    symbol: 'ETH',
    logoUrl:
      'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
    decimals: 18,
    balance: toHex(multiChainETHBalance),
    usdValue,
    tokenPrice: usdPrice ? Number(usdPrice) : undefined,
    breakdown: balances.map(balance => ({
      chainId: balance.chainId,
      balance: toHex(balance.balance),
      tokenAddress: '0x0000000000000000000000000000000000000000',
    })),
  };
};

const getTokenBalances = async ({ address }: { address: Hex }) => {
  const ethBalance = await getMultiChainETHBalance({ address });
  const tokenBalances = await getMultiChainERC20Balances({ address });

  return [ethBalance, ...tokenBalances];
};

export default getTokenBalances;
