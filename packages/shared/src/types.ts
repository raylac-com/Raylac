import { Hex } from 'viem';

export interface RelayGetQuoteRequestBody {
  user: Hex;
  recipient: Hex;
  originChainId: number;
  destinationChainId: number;
  amount: string;
  originCurrency: string;
  destinationCurrency: string;
  tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
}

export interface RelayExecutionStepItem {
  status: string;
  data: {
    to: Hex;
    data: Hex;
    value: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    chainId: number;
    gas?: number;
  };
  check: {
    endpoint: string;
    method: string;
  };
}

export interface DepositStep {
  id: 'deposit' | 'approve';
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
}

export interface SwapStep {
  originChainId: number;
  destinationChainId: number;
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
}

export interface ApproveStep {
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
}

export type SignedSingleInputSwapStep = SwapStep & {
  signature: Hex;
};

export type SignedApproveStep = ApproveStep & {
  signature: Hex;
};

export interface RelayExecutionStep {
  id: string;
  action: string;
  description: string;
  kind: string;
  requestId: string;
  items: RelayExecutionStepItem[];
}

export interface RelayGasFee {
  currency?: {
    chainId?: number;
    address?: Hex;
    symbol?: string;
    name?: string;
    decimals?: number;
  };
  amount?: string;
  amountFormatted?: string;
  amountUsd?: string;
}

export interface RelayGetQuoteResponseBody {
  steps: RelayExecutionStep[];
  fees: {
    gas: RelayGasFee;
    relayer: RelayGasFee;
    relayerGas: RelayGasFee;
    relayerService: RelayGasFee;
    app: RelayGasFee;
  };
  balances: {
    userBalance: string;
    requiredToSolve: string;
  };
  details: {
    operation: string;
    timeEstimate: number;
    userBalance: string;
    sender: string;
    recipient: string;
    currencyIn: {
      currency: {
        chainId: number;
        address: Hex;
        symbol: string;
        name: string;
        decimals: number;
        metadata: {
          logoURI: string;
          verified: boolean;
          isNative: boolean;
        };
      };
      amount: string;
      amountFormatted: string;
      amountUsd: string;
      minimumAmount: string;
    };
    currencyOut: {
      currency: {
        chainId: number;
        address: Hex;
        symbol: string;
        name: string;
        decimals: number;
        metadata: {
          logoURI: string;
          verified: boolean;
          isNative: boolean;
        };
      };
      amount: string;
      amountFormatted: string;
      amountUsd: string;
      minimumAmount: string;
    };
    totalImpact: {
      usd: string;
      percent: string;
    };
    swapImpact: {
      usd: string;
      percent: string;
    };
    rate: string;
    slippageTolerance: {
      origin: {
        usd: string;
        value: string;
        percent: string;
      };
      destination: {
        usd: string;
        value: string;
        percent: string;
      };
    };
  };
}

export interface CoingeckoTokenPriceResponse {
  [key: string]: {
    usd: number;
  };
}

export interface ChainGasInfo {
  baseFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  chainId: number;
}

export interface AlchemyTokenPriceResponse {
  network: string;
  address: Hex;
  prices: {
    currency: string;
    lastUpdatedAt: string;
    value: string;
  }[];
}

export interface RelaySwapMultiInputRequestBody {
  user: Hex;
  recipient: Hex;
  origins: {
    chainId: number;
    currency: string;
    amount: string;
  }[];
  destinationCurrency: string;
  destinationChainId: number;
  partial: boolean;
  tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  useUserOperation: boolean;
}

export type RelaySupportedCurrenciesResponseBody = {
  groupID: string;
  chainId: number;
  address: Hex;
  symbol: string;
  name: string;
  decimals: number;
  vmType: string;
  metadata: {
    logoURI: string;
    verified: boolean;
    isNative: boolean;
  };
}[][];

export interface Token {
  id: Hex;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  verified: boolean;
  isKnownToken?: boolean;
  addresses: {
    chainId: number;
    address: Hex;
  }[];
}

export interface SwapInput {
  chainId: number;
  amount: bigint;
  token: Token;
}

export interface SwapOutput {
  chainId: number;
  token: Token;
}

export interface SendInput {
  chainId: number;
  token: Token;
  amount: bigint;
}

export interface LidoApyResponse {
  data: {
    timeUnix: number;
    apr: number;
  };
  meta: {
    symbol: string;
    address: string;
    chainId: number;
  };
}

export enum TokenSet {
  ETH = 'eth',
}

export interface TokenAmount {
  amount: string;
  formatted: string;
  currencyValue: {
    raw: MultiCurrencyValue;
    formatted: MultiCurrencyValue;
  };
  tokenPrice: MultiCurrencyValue;
}

export interface PendingTx {
  chainId: number;
  txHash: Hex;
  from: Hex;
  to: Hex;
  amount: TokenAmount;
  token: Token;
}

export interface RelayGetRequestsReturnType {
  requests: {
    id: string;
    status: string;
    user: Hex;
    recipient: Hex;
    data: {
      failReason: string;
      fees: {
        gas: string;
        fixed: string;
        price: string;
      };
      feesUsd: {
        gas: string;
        fixed: string;
        price: string;
      };
      inTxs: {
        fee: string;
        data: {
          to: Hex;
          data: Hex;
          from: Hex;
          value: string;
        };
        stateChanges: {
          change: {
            data: {
              tokenKind: string;
              tokenAddress: Hex;
            };
            kind: string;
            balanceDiff: string;
          };
          address: Hex;
        }[];
        hash: Hex;
        block: number;
        type: string;
        chainId: number;
        timestamp: number;
      }[];
      currency: string;
      currencyObject: {
        chainId: number;
        address: Hex;
        symbol: string;
        name: string;
        decimals: number;
      };
      feeCurrency: string;
      feeCurrencyObject: {
        chainId: number;
        address: Hex;
        symbol: string;
        name: string;
        decimals: number;
      };
      metadata:
        | {
            sender: Hex;
            recipient: Hex;
            currencyIn: {
              currency: {
                chainId: number;
                address: Hex;
                symbol: string;
                name: string;
                decimals: number;
              };
              amount: string;
              amountFormatted: string;
              amountUsd: string;
              minimumAmount: string;
            };
            currencyOut: {
              currency: {
                chainId: number;
                address: Hex;
                symbol: string;
                name: string;
                decimals: number;
              };
              amount: string;
              amountFormatted: string;
              amountUsd: string;
              minimumAmount: string;
            };
            rate: string;
          }
        | undefined;
      timeEstimate: number;
      outTxs: {
        fee: string;
        data: {
          to: Hex;
          data: Hex;
          from: Hex;
          value: string;
        };
        stateChanges: {
          change: {
            data: {
              tokenKind: string;
              tokenAddress: Hex;
            };
            kind: string;
            balanceDiff: string;
          };
          address: Hex;
        }[];
        hash: Hex;
        block: number;
        type: string;
        chainId: number;
        timestamp: number;
      }[];
    };
    createdAt: string;
    updatedAt: string;
  }[];
}

export type DexScreenerPairsResponse = {
  pairs: {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: Hex;
    baseToken: {
      address: Hex;
      name: string;
      symbol: string;
    };
    quoteToken: {
      address: Hex;
      name: string;
      symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
      m5: {
        buys: number;
        sells: 1;
      };
      h1: {
        buys: number;
        sells: number;
      };
      h6: {
        buys: number;
        sells: number;
      };
      h24: {
        buys: number;
        sells: number;
      };
    };
    volume: {
      h24: number;
      h6: number;
      h1: number;
      m5: number;
    };
    priceChange: {
      h1: number;
      h6: number;
      h24: number;
    };
    liquidity: {
      usd: number;
      base: number;
      quote: number;
    };
    fdv: number;
    marketCap: number;
    info: {
      imageUrl: string;
      header: string;
      openGraph: string;
      websites: string[];
      socials: string[];
    };
  }[];
};

export interface MultiCurrencyValue {
  usd: string;
  jpy: string;
}
