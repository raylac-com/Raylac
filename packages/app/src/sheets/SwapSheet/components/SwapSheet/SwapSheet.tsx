import { useEffect, useState } from 'react';
import { Button, View } from 'react-native';
import SwapInputCard from '../SwapInputCard/SwapInputCard';
import SwapOutputCard from '../SwapOutputCard/SwapOutputCard';
import { trpc } from '@/lib/trpc';
import { formatUnits, hexToBigInt, parseUnits, toHex } from 'viem';
import useUserAddress from '@/hooks/useUserAddress';
import {
  GetSwapQuoteRequestBody,
  supportedChains,
  SupportedTokensReturnType,
  TRPCErrorMessage,
  UserOperation,
} from '@raylac/shared';
import ActionSheet from 'react-native-actions-sheet';
import useSignUserOps from '@/hooks/useSignUserOp';
import { getSignerAccount } from '@/lib/key';

type Token = SupportedTokensReturnType[number];

const Swap = () => {
  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<{
    amount: string;
    tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  }>();

  const { data: userAddress } = useUserAddress();

  const { data: _tokenBalances } = trpc.getTokenBalances.useQuery(
    {
      address: userAddress,
    },
    {
      enabled: !!userAddress,
    }
  );

  const { data: supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
  });

  useEffect(() => {
    if (supportedTokens) {
      setInputToken(supportedTokens[0] as Token);
      setOutputToken(supportedTokens[1] as Token);
    }
  }, [supportedTokens]);

  const {
    mutate: getSwapQuote,
    error: getSwapQuoteError,
    data: swapQuote,
  } = trpc.getSwapQuote.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: buildSwapUserOp } = trpc.buildSwapUserOp.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: submitUserOps } = trpc.submitUserOps.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: signUserOps } = useSignUserOps();

  useEffect(() => {
    if (
      userAddress &&
      amount &&
      inputToken &&
      outputToken &&
      amount?.tradeType
    ) {
      let parsedAmount;

      if (amount.tradeType === 'EXACT_INPUT') {
        parsedAmount = toHex(parseUnits(amount.amount, inputToken.decimals));
      } else {
        parsedAmount = toHex(parseUnits(amount.amount, outputToken.decimals));
      }

      getSwapQuote({
        senderAddress: userAddress,
        inputTokenAddress: inputToken?.tokenAddress ?? '',
        outputTokenAddress: outputToken?.tokenAddress ?? '',
        amount: parsedAmount,
        tradeType: amount.tradeType,
      } as GetSwapQuoteRequestBody);
    }
  }, [inputToken, userAddress, outputToken, amount, getSwapQuote]);

  const onInputAmountChange = (amount: string) => {
    setAmount({
      amount,
      tradeType: 'EXACT_INPUT',
    });
  };

  const onOutputAmountChange = (amount: string) => {
    setAmount({
      amount,
      tradeType: 'EXACT_OUTPUT',
    });
  };

  const onSwapPress = async () => {
    if (swapQuote) {
      const singerAddress = await getSignerAccount();
      const userOps = await buildSwapUserOp({
        singerAddress: singerAddress.address,
        quote: swapQuote,
      });

      const signedUserOps = await signUserOps(userOps as UserOperation[]);

      await submitUserOps(signedUserOps);
    }
  };

  const inputTokenBalance = _tokenBalances?.find(token =>
    token.breakdown?.some(
      breakdown => breakdown.tokenAddress === inputToken?.tokenAddress
    )
  )?.balance;

  const inputAmount =
    amount?.tradeType === 'EXACT_INPUT'
      ? parseUnits(amount.amount, inputToken.decimals)
      : swapQuote?.details?.currencyIn?.amount;

  const inputAmountFormatted = inputAmount
    ? formatUnits(BigInt(inputAmount), inputToken.decimals)
    : null;

  const outputAmount =
    amount?.tradeType === 'EXACT_OUTPUT'
      ? parseUnits(amount.amount, outputToken.decimals)
      : swapQuote?.details?.currencyOut?.amount;

  const outputAmountFormatted = outputAmount
    ? formatUnits(BigInt(outputAmount), outputToken.decimals)
    : null;

  const isAmountTooSmall =
    getSwapQuoteError?.message === TRPCErrorMessage.SWAP_AMOUNT_TOO_SMALL;

  return (
    <ActionSheet
      id="swap-sheet"
      containerStyle={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
    >
      <View
        style={{
          flexDirection: 'column',
          paddingVertical: 20,
          paddingHorizontal: 16,
          rowGap: 16,
        }}
      >
        <SwapInputCard
          token={inputToken}
          setToken={setInputToken}
          amount={inputAmountFormatted}
          setAmount={onInputAmountChange}
          balance={inputTokenBalance ? hexToBigInt(inputTokenBalance) : null}
        />
        <SwapOutputCard
          token={outputToken}
          setToken={setOutputToken}
          amount={outputAmountFormatted}
          setAmount={onOutputAmountChange}
        />
        {/**
         * Show quote
         */}
        <Button
          title={isAmountTooSmall ? 'Amount too small' : 'Swap'}
          onPress={onSwapPress}
        />
      </View>
    </ActionSheet>
  );
};

export default Swap;
