import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '../StyledText/StyledText';
import { View } from 'react-native';
import { Token, TokenAmount } from '@raylac/shared';
import fontSizes from '@/lib/styles/fontSizes';
import colors from '@/lib/styles/colors';
import { formatUnits } from 'viem';

const MinimumAmountOut = ({
  amount,
  token,
}: {
  amount: TokenAmount;
  token: Token;
}) => {
  const formattedAmount = formatUnits(
    BigInt(amount.amount),
    token.decimals
  ).slice(0, 12);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <StyledText style={{ color: colors.border }}>
        {`Minimum output`}
      </StyledText>
      <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
        {`${formattedAmount} ${token.symbol}`}
      </StyledText>
    </View>
  );
};

const MinimumAmountOutCurrency = ({ amount }: { amount: TokenAmount }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <StyledText style={{ color: colors.border }}>
        {`Minimum output (USD)`}
      </StyledText>
      <StyledText style={{ fontWeight: 'bold' }}>
        {`$${amount.usdValueFormatted}`}
      </StyledText>
    </View>
  );
};

const SlippagePercent = ({ slippagePercent }: { slippagePercent: number }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <StyledText style={{ color: colors.border }}>{`Max slippage`}</StyledText>
      <StyledText
        style={{ color: colors.border, fontWeight: 'bold' }}
      >{`${slippagePercent}%`}</StyledText>
    </View>
  );
};

export interface SlippageDetailsSheetProps {
  isOpen: boolean;
  token: Token;
  minimumAmountOut: TokenAmount;
  slippagePercent: number;
  onClose: () => void;
}

const SlippageDetailsSheet = ({
  isOpen,
  token,
  minimumAmountOut,
  slippagePercent,
  onClose,
}: SlippageDetailsSheetProps) => {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (isOpen) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [isOpen]);

  return (
    <BottomSheetModal
      ref={ref}
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 32,
      }}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['50%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          width: '100%',
          flexDirection: 'column',
          rowGap: 32,
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
      >
        <StyledText style={{ fontWeight: 'bold', fontSize: fontSizes.large }}>
          {`Slippage`}
        </StyledText>
        <View style={{ rowGap: 16, flexDirection: 'column' }}>
          <MinimumAmountOut amount={minimumAmountOut} token={token} />
          <MinimumAmountOutCurrency amount={minimumAmountOut} />
          <SlippagePercent slippagePercent={slippagePercent} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default SlippageDetailsSheet;
