import {
  CrossChainSwapStep,
  GetSingleChainSwapQuoteReturnType,
  GetSingleChainSwapQuoteRequestBody,
  formatAmount,
  formatUsdValue,
} from '@raylac/shared';
import { ed, st } from '@raylac/shared-backend';
import '../../lib/lifi';
import BigNumber from 'bignumber.js';
import { getQuote } from '@lifi/sdk';
import { Hex, hexToBigInt, hexToNumber } from 'viem';
import { getTokenAddressOnChain } from '../../utils';

const getSingleChainSwapQuote = async ({
  sender,
  amount,
  inputToken,
  outputToken,
  chainId,
}: GetSingleChainSwapQuoteRequestBody): Promise<GetSingleChainSwapQuoteReturnType> => {
  const inputTokenAddress = getTokenAddressOnChain(inputToken, chainId);
  const outputTokenAddress = getTokenAddressOnChain(outputToken, chainId);

  const qt = st('Get quote');
  const quote = await getQuote({
    fromAddress: sender,
    fromChain: chainId,
    toChain: chainId,
    fromToken: inputTokenAddress,
    toToken: outputTokenAddress,
    fromAmount: amount,
  });

  ed(qt);

  const data = quote.transactionRequest?.data;
  const to = quote.transactionRequest?.to;
  const value = quote.transactionRequest?.value;
  const gas = quote.transactionRequest?.gasLimit;

  if (!data || !to || value === undefined || !gas) {
    throw new Error('transactionRequest is undefined');
  }

  const swapStep: CrossChainSwapStep = {
    originChainId: chainId,
    destinationChainId: chainId,
    id: 'swap',
    tx: {
      data: data as Hex,
      to: to as Hex,
      value: hexToBigInt(value as Hex).toString(),
      maxFeePerGas: '',
      maxPriorityFeePerGas: '',
      chainId: chainId,
      gas: hexToNumber(gas as Hex),
      nonce: 0,
    },
  };

  const amountIn = amount;
  const amountOut = quote.estimate.toAmount;

  const amountInFormatted = formatAmount(amountIn, inputToken.decimals);
  const amountOutFormatted = formatAmount(amountOut, outputToken.decimals);

  if (!quote.estimate.fromAmountUSD) {
    throw new Error('fromAmountUSD is undefined');
  }

  if (!quote.estimate.toAmountUSD) {
    throw new Error('toAmountUSD is undefined');
  }

  const amountInUsd = formatUsdValue(
    new BigNumber(quote.estimate.fromAmountUSD)
  );
  const amountOutUsd = formatUsdValue(
    new BigNumber(quote.estimate.toAmountUSD)
  );

  return {
    swapSteps: [swapStep],
    relayerServiceFeeAmount: '0',
    relayerServiceFeeUsd: '0',
    amountIn,
    amountOut,
    amountInFormatted,
    amountOutFormatted,
    amountInUsd,
    amountOutUsd,
  };
};

export default getSingleChainSwapQuote;
