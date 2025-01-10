import StyledText from '@/components/StyledText/StyledText';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import Feather from '@expo/vector-icons/Feather';
import colors from '@/lib/styles/colors';
import {
  formatAmount,
  SupportedTokensReturnType,
  SwapOutput,
  SwapInput,
} from '@raylac/shared';
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
        <TokenLogoWithChain
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
        <Feather name="arrow-right" size={24} color={colors.subbedText} />
        <TokenLogoWithChain
          logoURI={outputToken.logoURI}
          chainId={outputChainId}
        />
      </View>
    </View>
  );
};

interface SwapPathProps {
  inputs: SwapInput[];
  output: SwapOutput;
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
