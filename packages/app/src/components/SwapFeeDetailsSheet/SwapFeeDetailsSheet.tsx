import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '../StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { View } from 'react-native';
import {
  ETH,
  getChainName,
  GetSingleInputSwapQuoteReturnType,
  Token,
  TokenAmount,
} from '@raylac/shared';
import fontSizes from '@/lib/styles/fontSizes';
import RelayLogo from '../RelayLogo/RelayLogo';
import ChainLogo from '../ChainLogo/ChainLogo';

const OriginChainGas = ({
  chainId,
  amount,
}: {
  chainId: number;
  token: Token;
  amount: TokenAmount;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <ChainLogo chainId={chainId} size={20} />
        <StyledText style={{ color: colors.border }}>
          {`${getChainName(chainId)} gas`}
        </StyledText>
      </View>
      <View
        style={{ flexDirection: 'column', alignItems: 'center', columnGap: 8 }}
      >
        <StyledText style={{ color: colors.border }}>
          {`$${amount.usdValueFormatted}`}
        </StyledText>
      </View>
    </View>
  );
};

const DestinationChainGas = ({
  chainId,
  amount,
}: {
  chainId: number;
  token: Token;
  amount: TokenAmount;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <ChainLogo chainId={chainId} size={20} />
        <StyledText style={{ color: colors.border }}>
          {`${getChainName(chainId)} gas`}
        </StyledText>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
      >
        <StyledText style={{ color: colors.border }}>
          {`$${amount.usdValueFormatted}`}
        </StyledText>
      </View>
    </View>
  );
};

const RelayServiceFee = ({ amount }: { amount: TokenAmount }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <RelayLogo size={20} />
        <StyledText style={{ color: colors.border }}>
          {`Bridge service fee`}
        </StyledText>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
      >
        <StyledText style={{ color: colors.border }}>
          {`$${amount.usdValueFormatted}`}
        </StyledText>
      </View>
    </View>
  );
};

const TotalFee = ({ usdValueFormatted }: { usdValueFormatted: string }) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
        {`Total`}
      </StyledText>
      <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
        {`$${usdValueFormatted}`}
      </StyledText>
    </View>
  );
};

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
          <OriginChainGas
            chainId={swapQuote.fromChainId}
            token={ETH}
            amount={swapQuote.originChainGas}
          />
          {swapQuote.toChainId !== swapQuote.fromChainId && (
            <DestinationChainGas
              chainId={swapQuote.toChainId}
              token={swapQuote.relayerGasToken}
              amount={swapQuote.relayerGas}
            />
          )}
          <RelayServiceFee amount={swapQuote.relayerServiceFee} />
          <View style={{ marginTop: 16 }}>
            <TotalFee usdValueFormatted={swapQuote.totalFeeUsd} />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default SwapFeeDetailsSheet;
