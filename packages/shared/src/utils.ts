import { TokenAmount, Token, MultiCurrencyValue } from './types';
import { Chain, formatUnits, Hex, parseUnits, PrivateKeyAccount } from 'viem';
import * as chains from 'viem/chains';
import { getAlchemyRpcUrl } from './ethRpc';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { TokenBalancesReturnType } from './rpcTypes';

/**
 * Returns viem's `Chain` object from a chain ID
 */
export const getChainFromId = (chainId: number): Chain => {
  const chain = Object.entries(chains).find(
    ([_, chain]) => chain.id === chainId
  );

  if (!chain) {
    throw new Error(`Chain with ID ${chainId} not found`);
  }

  return chain[1] as Chain;
};

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calls the `eth_maxPriorityFeePerGas` JSON-RPC method
 */
export const getMaxPriorityFeePerGas = async ({
  chainId,
}: {
  chainId: number;
}): Promise<bigint> => {
  const url = getAlchemyRpcUrl({ chain: getChainFromId(chainId) });

  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post<{
    result?: Hex;
    error?: {
      code: number;
      message: string;
    };
  }>(
    url,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_maxPriorityFeePerGas',
      params: [],
    },
    config
  );

  if (result.data.error) {
    throw new Error(JSON.stringify(result.data.error));
  }

  return BigInt(result.data.result!);
};

const CHAIN_NAMES: Record<number, string> = {
  [chains.mainnet.id]: 'Ethereum',
  [chains.base.id]: 'Base',
  [chains.arbitrum.id]: 'Arbitrum',
  [chains.optimism.id]: 'Optimism',
  [chains.scroll.id]: 'Scroll',
  [chains.polygon.id]: 'Polygon',
  [chains.zksync.id]: 'ZkSync',
  [chains.avalanche.id]: 'Avalanche',
  [chains.fantom.id]: 'Fantom',
  [chains.gnosis.id]: 'Gnosis',
  [chains.bsc.id]: 'BSC',
};

export const getChainName = (chainId: number): string => {
  // eslint-disable-next-line security/detect-object-injection
  return CHAIN_NAMES[chainId];
};

export const signEIP1159Tx = async ({
  tx,
  account,
}: {
  tx: {
    to: Hex;
    data: Hex;
    value: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    nonce: number;
    chainId: number;
    gas: number;
  };
  account: PrivateKeyAccount;
}) => {
  return await account.signTransaction({
    to: tx.to,
    value: BigInt(tx.value),
    data: tx.data,
    gas: BigInt(tx.gas),
    maxFeePerGas: BigInt(tx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
    nonce: tx.nonce,
    chainId: tx.chainId,
  });
};

const formatNumber = (num: BigNumber): string => {
  if (num.lte(new BigNumber('0.01'))) {
    // Count the number of zeros after the decimal point
    const afterDecimal = num.toFormat().split('.')[1];
    if (afterDecimal === undefined) {
      return num.toFormat(0);
    }

    const zeros = afterDecimal.split('').findIndex(char => char !== '0');

    if (zeros === -1) {
      return num.toFormat(0);
    }

    return num.toFixed(zeros + 2);
  }

  if (num.lt(new BigNumber('1000'))) {
    return num.toFixed(2).replace(/\.?0+$/, '');
  }

  return num.toFormat(0);
};

export const formatAmount = (amount: string, decimals: number): string => {
  const formatted = new BigNumber(formatUnits(BigInt(amount), decimals));
  return formatNumber(formatted);
};

export const formatUsdValue = (num: BigNumber): string => {
  return formatNumber(num);
};

export const formatJpyValue = (num: BigNumber): string => {
  return num.toFixed();
};

export const formatTokenAmount = ({
  amount,
  token,
  tokenPrice,
}: {
  amount: bigint;
  token: Token;
  tokenPrice: MultiCurrencyValue;
}): TokenAmount => {
  const usdValue = new BigNumber(
    formatUnits(amount, token.decimals)
  ).multipliedBy(tokenPrice.usd);

  const jpyValue = new BigNumber(
    formatUnits(amount, token.decimals)
  ).multipliedBy(tokenPrice.jpy);

  const usdValueFormatted = formatUsdValue(usdValue);
  const jpyValueFormatted = formatUsdValue(jpyValue);

  const amountFormatted: TokenAmount = {
    amount: amount.toString(),
    formatted: formatAmount(amount.toString(), token.decimals),
    currencyValue: {
      raw: {
        usd: usdValue.toFixed(),
        jpy: jpyValue.toFixed(),
      },
      formatted: {
        usd: usdValueFormatted,
        jpy: jpyValueFormatted,
      },
    },
    tokenPrice,
  };

  return amountFormatted;
};

/**
 * Get the price of a token from the token balances RPC response
 */
const getTokenPriceFromTokenBalances = ({
  tokenBalances,
  token,
}: {
  tokenBalances: TokenBalancesReturnType;
  token: Token;
}): MultiCurrencyValue => {
  const tokenPrice = tokenBalances.find(
    balance => balance.token.id === token.id
  )?.balance.tokenPrice;

  if (!tokenPrice) {
    throw new Error(`Token price not found for token ${token.symbol}`);
  }

  return tokenPrice;
};

/**
 * Extracts the chain token balance of a token from a list of token balances
 */
export const getChainTokenBalance = ({
  tokenBalances,
  chainId,
  token,
}: {
  tokenBalances: TokenBalancesReturnType;
  chainId: number;
  token: Token;
}): TokenAmount => {
  const tokenPrice = getTokenPriceFromTokenBalances({
    tokenBalances,
    token,
  });

  const tokenBalancesOnChain = tokenBalances.filter(
    balance => balance.chainId === chainId && balance.token.id === token.id
  );

  const totalBalance = tokenBalancesOnChain.reduce(
    (acc, balance) => acc + BigInt(balance.balance.amount),
    BigInt(0)
  );

  const balance = formatTokenAmount({
    amount: totalBalance,
    token,
    tokenPrice,
  });

  return balance;
};

/**
 * Extracts the address's chain token balance of the given token from a list of token balances
 */
export const getAddressChainTokenBalance = ({
  tokenBalances,
  address,
  chainId,
  token,
}: {
  tokenBalances: TokenBalancesReturnType;
  address: Hex;
  chainId: number;
  token: Token;
}): TokenAmount => {
  const addressChainTokenBalance = tokenBalances.find(
    balance =>
      balance.address === address &&
      balance.token.id === token.id &&
      balance.chainId === chainId
  );

  if (!addressChainTokenBalance) {
    return {
      amount: '0',
      formatted: '0',
      currencyValue: {
        raw: {
          usd: '0',
          jpy: '0',
        },
        formatted: {
          usd: '0',
          jpy: '0',
        },
      },
      tokenPrice: getTokenPriceFromTokenBalances({
        tokenBalances,
        token,
      }),
    };
  }

  return addressChainTokenBalance.balance;
};

export const getTotalUsdValue = (tokenBalances: TokenBalancesReturnType) => {
  return formatUsdValue(
    tokenBalances.reduce(
      (acc, tokenBalance) =>
        acc.plus(
          new BigNumber(Number(tokenBalance.balance.currencyValue.raw.usd))
        ),
      new BigNumber(0)
    )
  );
};

export const groupTokenBalancesByToken = ({
  tokenBalances,
}: {
  tokenBalances: TokenBalancesReturnType;
}): {
  token: Token;
  totalBalance: TokenAmount;
}[] => {
  if (tokenBalances.length === 0) {
    return [];
  }

  const uniqueTokenIds = [
    ...new Set(tokenBalances.map(tokenBalance => tokenBalance.token.id)),
  ];

  const groupedByToken = [];

  for (const tokenId of uniqueTokenIds) {
    const balances = tokenBalances.filter(
      tokenBalance => tokenBalance.token.id === tokenId
    );

    const totalBalance = balances.reduce(
      (acc, tokenBalance) => acc + BigInt(tokenBalance.balance.amount),
      BigInt(0)
    );

    const formattedTotalBalance = formatTokenAmount({
      amount: totalBalance,
      token: balances[0].token,
      tokenPrice: balances[0].balance.tokenPrice,
    });

    const token = balances[0].token;

    groupedByToken.push({ token, totalBalance: formattedTotalBalance });
  }

  // Sort by usd value in descending order
  const sortedGroupedByToken = groupedByToken.sort((a, b) => {
    return (
      Number(b.totalBalance.currencyValue.raw.usd) -
      Number(a.totalBalance.currencyValue.raw.usd)
    );
  });

  return sortedGroupedByToken;
};

/**
 * Get all token balances of a token for a given address
 */
export const getAddressTokenBalances = ({
  tokenBalances,
  address,
}: {
  tokenBalances: TokenBalancesReturnType;
  address: Hex;
}) => {
  const addressTokenBalances = tokenBalances.filter(
    tokenBalance => tokenBalance.address === address
  );

  return addressTokenBalances;
};

export type PerAddressTokenBalance = {
  totalBalance: TokenAmount;
  perAddressBreakdown: {
    address: Hex;
    totalBalance: TokenAmount;
    chainBalances: {
      address: Hex;
      balance: TokenAmount;
      chainId: number;
    }[];
  }[];
};

/**
 * Get per address balance of a token
 */
export const getPerAddressTokenBalance = ({
  tokenBalances,
  token,
}: {
  tokenBalances: TokenBalancesReturnType;
  token: Token;
}): PerAddressTokenBalance => {
  const balances = tokenBalances.filter(
    balance => balance.token.id === token.id
  );

  const addresses = [...new Set(balances.map(balance => balance.address))];

  const balancesPerAddress = [];

  for (const address of addresses) {
    const addressBalances = balances.filter(
      balance => balance.address === address
    );

    const totalBalance = addressBalances.reduce(
      (acc, balance) => acc + BigInt(balance.balance.amount),
      BigInt(0)
    );

    const formattedTotalBalance = formatTokenAmount({
      amount: totalBalance,
      token,
      tokenPrice: addressBalances[0].balance.tokenPrice,
    });

    balancesPerAddress.push({
      address,
      totalBalance: formattedTotalBalance,
      chainBalances: addressBalances.map(balance => ({
        address: balance.address,
        balance: balance.balance,
        chainId: balance.chainId,
      })),
    });
  }

  const totalBalance = balancesPerAddress.reduce(
    (acc, balance) => acc + BigInt(balance.totalBalance.amount),
    BigInt(0)
  );

  const tokenPrice =
    balancesPerAddress.length > 0
      ? balancesPerAddress[0].totalBalance.tokenPrice
      : {
          usd: '0',
          jpy: '0',
        };

  const formattedTotalBalance = formatTokenAmount({
    amount: totalBalance,
    token,
    tokenPrice,
  });

  return {
    totalBalance: formattedTotalBalance,
    perAddressBreakdown: balancesPerAddress,
  };
};

export type AddressTokenBalances = {
  address: Hex;
  tokenBalances: {
    token: Token;
    totalBalance: TokenAmount;
    chainBalances: {
      chainId: number;
      balance: TokenAmount;
    }[];
  }[];
};

export const getTokenBalancePerAddress = ({
  tokenBalances,
  addresses,
}: {
  tokenBalances: TokenBalancesReturnType;
  addresses: Hex[];
}) => {
  if (tokenBalances.length === 0) {
    return [];
  }

  const tokenBalancesPerAddress: AddressTokenBalances[] = [];

  for (const address of addresses) {
    const addressTokenBalances = tokenBalances.filter(
      balance => balance.address === address
    );

    // Group by token
    const addressTokenIds = [
      ...new Set(addressTokenBalances.map(balance => balance.token.id)),
    ];

    const groupByTokens = [];

    for (const tokenId of addressTokenIds) {
      const tokenBalances = addressTokenBalances.filter(
        balance => balance.token.id === tokenId
      );

      const totalBalance = tokenBalances.reduce(
        (acc, balance) => acc + BigInt(balance.balance.amount),
        BigInt(0)
      );

      const formattedTotalBalance = formatTokenAmount({
        amount: totalBalance,
        token: tokenBalances[0].token,
        tokenPrice: tokenBalances[0].balance.tokenPrice,
      });

      groupByTokens.push({
        token: tokenBalances[0].token,
        totalBalance: formattedTotalBalance,
        chainBalances: tokenBalances.map(balance => ({
          chainId: balance.chainId,
          balance: balance.balance,
        })),
      });
    }

    tokenBalancesPerAddress.push({
      address,
      tokenBalances: groupByTokens,
    });
  }

  return tokenBalancesPerAddress;
};

export const getTokenAddressOnChain = (token: Token, chainId: number): Hex => {
  const address = token.addresses.find(
    (address: { chainId: number }) => address.chainId === chainId
  )?.address;

  if (!address) {
    throw new Error(
      `Token ${token.symbol} address not found for chainId ${chainId}`
    );
  }

  return address;
};

export const getExplorerUrl = (chainId: number) => {
  switch (chainId) {
    case chains.mainnet.id:
      return 'https://etherscan.io';
    case chains.base.id:
      return 'https://basescan.org';
    case chains.optimism.id:
      return 'https://optimistic.etherscan.io';
    case chains.arbitrum.id:
      return 'https://arbiscan.io';
    default:
      return '';
  }
};

const COLORS = [
  { name: 'Cerulean', hex: '#007BA7' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Saffron', hex: '#F4C430' },
  { name: 'Emerald', hex: '#50C878' },
  { name: 'Amethyst', hex: '#9966CC' },
  { name: 'Crimson', hex: '#DC143C' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Turquoise', hex: '#40E0D0' },
  { name: 'Salmon', hex: '#FA8072' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Slate Blue', hex: '#6A5ACD' },
  { name: 'Steel Blue', hex: '#4682B4' },
  { name: 'Pale Gold', hex: '#E6BE8A' },
  { name: 'Olive Green', hex: '#808000' },
  { name: 'Peach', hex: '#FFCBA4' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Mint', hex: '#98FF98' },
  { name: 'Mulberry', hex: '#C54B8C' },
  { name: 'Azure', hex: '#007FFF' },
  { name: 'Sandy Brown', hex: '#F4A460' },
];

export const getColorForAddress = (address: Hex): Hex => {
  // Convert address to number by taking first 4 bytes
  const addressNum = parseInt(address.slice(2, 10), 16);
  // Use modulo to get index within COLORS array bounds
  const colorIndex = addressNum % COLORS.length;

  // eslint-disable-next-line security/detect-object-injection
  return COLORS[colorIndex].hex as Hex;
};

export const MOCK_TOKEN_AMOUNT: TokenAmount = {
  amount: parseUnits('0.01', 18).toString(),
  formatted: '0.01',
  tokenPrice: {
    usd: '123.45',
    jpy: '17283',
  },
  currencyValue: {
    raw: {
      usd: '123.45',
      jpy: '17283',
    },
    formatted: {
      usd: '123.45',
      jpy: '17,283',
    },
  },
};

export const containsNonNumericCharacters = (text: string) => {
  const parsed = new BigNumber(text);

  // Check if the result is not NaN and is finite
  return parsed.isNaN() || !parsed.isFinite();
};

/**
 * Check if the given balance is sufficient for the given amount input
 */
export const checkIsBalanceSufficient = (
  amountInputText: string,
  tokenBalance: TokenAmount,
  // TODO: Other other currencies as well
  amountInputMode: 'token' | 'usd',
  token: Token
) => {
  let parsedTokenAmount: bigint;

  if (amountInputMode === 'token') {
    parsedTokenAmount = parseUnits(amountInputText, token.decimals);
  } else {
    // Convert the usd amount to a token amount in string representation
    const inputTokenAmount = new BigNumber(amountInputText)
      .dividedBy(tokenBalance.tokenPrice.usd)
      .toFixed();

    // Parse the token amount
    parsedTokenAmount = parseUnits(inputTokenAmount, token.decimals);
  }

  const isBalanceSufficient = parsedTokenAmount <= BigInt(tokenBalance.amount);

  return isBalanceSufficient;
};

export const chainIdToCoingeckoId = (chainId: number) => {
  switch (chainId) {
    case chains.mainnet.id:
      return 'ethereum';
    case chains.base.id:
      return 'base';
    case chains.arbitrum.id:
      return 'arbitrum';
    case chains.optimism.id:
      return 'optimism';
    case chains.polygon.id:
      return 'polygon-pos';
    default:
      throw new Error(
        `chainIdToCoingeckoId: Chain ID ${chainId} not supported`
      );
  }
};
