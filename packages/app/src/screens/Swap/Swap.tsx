import { useState } from 'react';
import { Button, View } from 'react-native';
import InputTokenSelector from './components/InputTokenSelector';
import OutputTokenSelector from './components/OutputTokenSelector';
import { SupportedToken } from '@/types';
import { trpc } from '@/lib/trpc';
import { zeroAddress } from 'viem';
import useUserAddress from '@/hooks/useUserAddress';
import { supportedChains } from '@raylac/shared';

const Swap = () => {
  const [inputToken, setInputToken] = useState<SupportedToken | null>(null);
  const [outputToken, setOutputToken] = useState<SupportedToken | null>(null);
  const [inputAmount, setInputAmount] = useState<string>('0');
  const [outputAmount, setOutputAmount] = useState<string>('0');

  //  const [swapInput, setSwapInput] = useState<SwapInput[] | null>(null);
  //  const [swapOutput, setSwapOutput] = useState<SwapOutput | null>(null);

  const { data: userAddress } = useUserAddress();

  const { data: _supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
  });

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
        tokenAddress: inputToken?.address ?? '',
        amount: inputAmount,
        chainId: inputToken?.chainId ?? 0,
      },
    ],
    swapOutput: {
      tokenAddress: outputToken?.address ?? '',
      chainId: outputToken?.chainId ?? 0,
    },
  });

  const onReviewPress = () => {};

  // Get quote from the user op

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <InputTokenSelector
        token={inputToken}
        setToken={setInputToken}
        amount={inputAmount}
        setAmount={setInputAmount}
      />
      <OutputTokenSelector
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
