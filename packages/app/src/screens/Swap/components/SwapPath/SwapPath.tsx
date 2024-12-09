import StyledText from '@/components/StyledText/StyledText';
import TokenImageWithChain from '@/components/TokenImageWithChain/TokenImageWithChain';
import AntDesign from '@expo/vector-icons/AntDesign';
import colors from '@/lib/styles/colors';
import { formatAmount, SupportedTokensReturnType } from '@raylac/shared';
import { View } from 'react-native';

const SwapPathListItem = ({
  inputToken,
  inputChainId,
  outputToken,
  outputChainId,
  amount,
}: {
  inputToken: SupportedTokensReturnType[number];
  inputChainId: number;
  outputToken: SupportedTokensReturnType[number];
  outputChainId: number;
  amount: bigint;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: 4,
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
      >
        <TokenImageWithChain
          logoURI={inputToken.logoURI}
          chainId={inputChainId}
        />
        <StyledText
          style={{
            color: colors.subbedText,
          }}
        >
          {formatAmount(amount.toString(), inputToken.decimals)}{' '}
          {inputToken.symbol}
        </StyledText>
        <AntDesign name="arrowright" size={24} color={colors.subbedText} />
        <TokenImageWithChain
          logoURI={outputToken.logoURI}
          chainId={outputChainId}
        />
      </View>
    </View>
  );
};

interface SwapPathProps {
  inputs: {
    chainId: number;
    amount: bigint;
    token: SupportedTokensReturnType[number];
  }[];
  output: {
    chainId: number;
    token: SupportedTokensReturnType[number];
  };
}

const SwapPath = ({ inputs, output }: SwapPathProps) => {
  return (
    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
      {inputs.map((input, index) => (
        <SwapPathListItem
          key={index}
          inputToken={input.token}
          inputChainId={input.chainId}
          outputToken={output.token}
          outputChainId={output.chainId}
          amount={input.amount}
        />
      ))}
    </View>
  );
};

export default SwapPath;
