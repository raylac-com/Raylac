import {
  GetSwapQuoteRequestBody,
  GetSwapQuoteResponseBody,
  RelayGasFee,
} from '@raylac/shared';
import { formatUnits, hexToBigInt } from 'viem';
import { faker } from '@faker-js/faker';

const mockRelayGasFee: RelayGasFee = {
  amount: '1000',
  amountFormatted: '0.01',
  amountUsd: '1234',
  currency: {
    symbol: 'USD',
  },
};

const getSwapQuote = async (
  args: GetSwapQuoteRequestBody
): Promise<GetSwapQuoteResponseBody> => {
  const sender = args.senderAddress;
  const inputToken = args.inputTokenAddress;
  const outputToken = args.outputTokenAddress;
  const tradeType = args.tradeType;

  const amount = hexToBigInt(args.amount);

  const inputAmount =
    tradeType === 'EXACT_INPUT'
      ? amount
      : faker.number.bigInt({ min: 1n, max: 100000000n });

  const outputAmount =
    tradeType === 'EXACT_OUTPUT'
      ? amount
      : faker.number.bigInt({ min: 1n, max: 100000000n });

  const tokenDecimals = 18;

  const inputAmountFormatted = formatUnits(inputAmount, tokenDecimals);
  const outputAmountFormatted = formatUnits(outputAmount, tokenDecimals);

  const inputAmountUsd = faker.number.float({ min: 1, max: 100 }).toFixed(6);
  const outputAmountUsd = faker.number.float({ min: 1, max: 100 }).toFixed(6);

  return {
    steps: [],
    fees: {
      gas: mockRelayGasFee,
      relayer: mockRelayGasFee,
      relayerGas: mockRelayGasFee,
      relayerService: mockRelayGasFee,
      app: mockRelayGasFee,
    },
    balances: {
      userBalance: '1000000000000000000000000',
      requiredToSolve: '1000000000000000000000000',
    },
    details: {
      operation: '<string>',
      timeEstimate: 123,
      userBalance: '1000000000000000000000000',
      sender,
      recipient: sender,
      currencyIn: {
        currency: {
          chainId: 8453,
          address: inputToken,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          metadata: {
            logoURI: 'https://ethereum-optimism.github.io/data/USDC/logo.png',
            verified: false,
            isNative: false,
          },
        },
        amount: inputAmount.toString(),
        amountFormatted: inputAmountFormatted,
        amountUsd: inputAmountUsd,
        minimumAmount: inputAmount.toString(),
      },
      currencyOut: {
        currency: {
          chainId: 8453,
          address: outputToken,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          metadata: {
            logoURI: 'https://ethereum-optimism.github.io/data/USDC/logo.png',
            verified: false,
            isNative: false,
          },
        },
        amount: outputAmount.toString(),
        amountFormatted: outputAmountFormatted,
        amountUsd: outputAmountUsd,
        minimumAmount: outputAmount.toString(),
      },
      totalImpact: {
        usd: '<string>',
        percent: '<string>',
      },
      swapImpact: {
        usd: '<string>',
        percent: '<string>',
      },
      rate: '<string>',
      slippageTolerance: {
        origin: {
          usd: '<string>',
          value: '<string>',
          percent: '<string>',
        },
        destination: {
          usd: '<string>',
          value: '<string>',
          percent: '<string>',
        },
      },
    },
  };
};

export default getSwapQuote;
