import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '../StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { View } from 'react-native';
import { GetSingleInputSwapQuoteReturnType } from '@raylac/shared';
import fontSizes from '@/lib/styles/fontSizes';
import RelayLogo from '../RelayLogo/RelayLogo';
import GasLogo from '../GasLogo/GasLogo';

export interface SwapFeeDetailsSheetProps {
  isOpen: boolean;
  swapQuote: GetSingleInputSwapQuoteReturnType;
  onClose: () => void;
}

const SwapFeeDetailsSheet = ({
  isOpen,
  swapQuote,
  onClose,
}: SwapFeeDetailsSheetProps) => {
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
          {`Swap fee`}
        </StyledText>
        <View style={{ rowGap: 16, flexDirection: 'column' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <GasLogo size={24} />
              <StyledText style={{ color: colors.border }}>
                {`Origin chain gas fee `}
              </StyledText>
            </View>
            <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
              {`${swapQuote.originChainGas.usdValueFormatted} USD (ETH)`}
            </StyledText>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <GasLogo size={24} />
              <StyledText style={{ color: colors.border }}>
                {`Destination chain gas fee `}
              </StyledText>
            </View>
            <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
              {`${swapQuote.relayerGas.usdValueFormatted} USD (${swapQuote.relayerGasToken.symbol})`}
            </StyledText>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <RelayLogo size={24} />
              <StyledText style={{ color: colors.border }}>
                {`Relay service fee `}
              </StyledText>
            </View>
            <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
              {`${swapQuote.relayerServiceFee.usdValueFormatted} USD`}
            </StyledText>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default SwapFeeDetailsSheet;
