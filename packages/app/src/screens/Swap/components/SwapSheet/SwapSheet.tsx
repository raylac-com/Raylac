import { useState } from 'react';
import { Button, View } from 'react-native';
import SwapInputCard from '../SwapInputCard/SwapInputCard';
import SwapOutputCard from '../SwapOutputCard/SwapOutputCard';
import { trpc } from '@/lib/trpc';
import { hexToBigInt, zeroAddress } from 'viem';
import useUserAddress from '@/hooks/useUserAddress';
import { SupportedTokensReturnType } from '@raylac/shared';

type Token = SupportedTokensReturnType[number];

const Swap = () => {
  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [inputAmount, setInputAmount] = useState<string>('0');
  const [outputAmount, setOutputAmount] = useState<string>('0');

  const { data: userAddress } = useUserAddress();

  const { data: _tokenBalances } = trpc.getTokenBalances.useQuery(
    {
      address: userAddress ?? zeroAddress,
    },
    {
      enabled: !!userAddress,
    }
  );

  const { data: _swapQuote } = trpc.getSwapQuote.useQuery({
    senderAddress: zeroAddress,
    swapInput: [
      {
        tokenAddress: inputToken?.tokenAddress ?? '',
        amount: inputAmount,
        chainId: 0,
      },
    ],
    swapOutput: {
      tokenAddress: outputToken?.tokenAddress ?? '',
      chainId: 0,
    },
  });

  const onReviewPress = () => {};

  const inputTokenBalance = _tokenBalances?.find(token =>
    token.breakdown?.some(
      breakdown => breakdown.tokenAddress === inputToken?.tokenAddress
    )
  )?.balance;

  return (
    <View style={{ flexDirection: 'column', rowGap: 16 }}>
      <SwapInputCard
        token={inputToken}
        setToken={setInputToken}
        amount={inputAmount}
        setAmount={setInputAmount}
        balance={inputTokenBalance ? hexToBigInt(inputTokenBalance) : null}
      />
      <SwapOutputCard
        token={outputToken}
        setToken={setOutputToken}
        amount={outputAmount}
        setAmount={setOutputAmount}
      />
      {/**
       * Show quote
       */}
      <Button title="Review" onPress={onReviewPress} />
    </View>
  );
};

export default Swap;
