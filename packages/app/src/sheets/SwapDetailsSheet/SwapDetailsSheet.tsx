import StyledText from '@/components/StyledText/StyledText';
import { View } from 'react-native';

import ActionSheet, { SheetProps } from 'react-native-actions-sheet';
import SwapIOCard from './components/SwapIOCard';
import useTokenMeta from '@/hooks/useTokenMeta';
import { Hex } from 'viem';
import AntDesign from '@expo/vector-icons/AntDesign';
import colors from '@/lib/styles/colors';
import TokenImageWithChain from '@/components/TokenImageWithChain/TokenImageWithChain';

export type SwapDetailsSheetProps = SheetProps<'swap-details-sheet'>;

const SwapDetailsSheet = (props: SwapDetailsSheetProps) => {
  const { payload: swap } = props;

  const { data: tokenMetaIn } = useTokenMeta(swap!.tokenAddressIn as Hex);
  const { data: tokenMetaOut } = useTokenMeta(swap!.tokenAddressOut as Hex);

  if (!swap) {
    throw new Error('Swap details sheet requires a swap');
  }

  if (!tokenMetaIn || !tokenMetaOut) return null;

  const inputChains = swap.transactions.map(t => t.chainId);
  const outputChain = swap.transactions[0].chainId;

  return (
    <ActionSheet
      id="swap-details-sheet"
      containerStyle={{
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          paddingVertical: 20,
          rowGap: 16,
        }}
      >
        <StyledText>{`Swap`} </StyledText>
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <SwapIOCard
            token={tokenMetaIn}
            amount={BigInt(swap.amountIn)}
            usdAmount={Number(swap.usdAmountIn)}
          />
          <AntDesign name="arrowright" size={24} color={colors.subbedText} />
          <SwapIOCard
            token={tokenMetaOut}
            amount={BigInt(swap.amountOut)}
            usdAmount={Number(swap.usdAmountOut)}
          />
        </View>
        <StyledText>{`Gas fee covered by Raylac`}</StyledText>
        <View style={{ flexDirection: 'row', columnGap: 8 }}>
          {/* Input tokens */}
          {inputChains.map((chainId, i) => (
            <TokenImageWithChain
              key={i}
              logoURI={tokenMetaIn.logoURI}
              chainId={chainId}
            />
          ))}
          <AntDesign name="arrowright" size={24} color={colors.subbedText} />
          {/* Output token */}
          <TokenImageWithChain
            logoURI={tokenMetaOut.logoURI}
            chainId={outputChain}
          />
        </View>
      </View>
    </ActionSheet>
  );
};

export default SwapDetailsSheet;
