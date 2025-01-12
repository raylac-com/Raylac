import Feather from '@expo/vector-icons/Feather';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { getExplorerUrl, SwapHistoryItem } from '@raylac/shared';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '../StyledText/StyledText';
import { useTranslation } from 'react-i18next';
import fontSizes from '@/lib/styles/fontSizes';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import colors from '@/lib/styles/colors';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import { Linking, Pressable, View } from 'react-native';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';
import { Hex } from 'viem';
import Toast from 'react-native-toast-message';
import useEnsName from '@/hooks/useEnsName';
import ChainLogo from '../ChainLogo/ChainLogo';

export interface SwapListItemSheetProps {
  swap: SwapHistoryItem;
  onClose: () => void;
}

const shortenTxHash = (txHash: string) => {
  return `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
};

const Address = ({ address }: { address: Hex }) => {
  const { data: senderEnsName } = useEnsName(address);
  const { t } = useTranslation('SwapListItemSheet');
  const onCopyPress = () => {
    copyToClipboard(address);

    Toast.show({
      type: 'success',
      text1: 'Copied to clipboard',
    });
  };

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <StyledText style={{ color: colors.subbedText }}>
        {t('address')}{' '}
      </StyledText>
      <FeedbackPressable
        onPress={onCopyPress}
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <Feather name="copy" size={18} color={colors.subbedText} />
        <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
          {senderEnsName ?? shortenAddress(address)}
        </StyledText>
      </FeedbackPressable>
    </Pressable>
  );
};

const TxHash = ({ txHash, chainId }: { txHash: string; chainId: number }) => {
  const { t } = useTranslation('SwapListItemSheet');
  return (
    <FeedbackPressable
      style={{ flexDirection: 'row', justifyContent: 'space-between' }}
      onPress={() => {
        Linking.openURL(`${getExplorerUrl(chainId)}/tx/${txHash}`);
      }}
    >
      <StyledText style={{ color: colors.subbedText }}>
        {t('transaction')}{' '}
      </StyledText>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <ChainLogo chainId={chainId} size={18} />
        <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
          {`${shortenTxHash(txHash)}`}
        </StyledText>
      </View>
    </FeedbackPressable>
  );
};

const DateTime = ({ date }: { date: Date }) => {
  const { t } = useTranslation('SwapListItemSheet');
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <StyledText style={{ color: colors.subbedText }}>{t('time')} </StyledText>
      <StyledText style={{ color: colors.subbedText }}>
        {new Date(date).toLocaleDateString()}{' '}
        {new Date(date).toLocaleTimeString()}
      </StyledText>
    </View>
  );
};

const SwapListItemSheet = ({ swap, onClose }: SwapListItemSheetProps) => {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  const label = 'Swap';

  useEffect(() => {
    ref.current?.present();
  }, []);

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
      snapPoints={['100%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          width: '100%',
          flexDirection: 'column',
          rowGap: 24,
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
      >
        <StyledText
          style={{ fontWeight: 'bold', fontSize: fontSizes.large }}
        >{`${label} details`}</StyledText>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                rowGap: 8,
                flex: 1,
              }}
            >
              <TokenLogoWithChain
                logoURI={swap.tokenIn.logoURI}
                chainId={swap.chainId}
                size={64}
              />
              <StyledText style={{ color: colors.subbedText }}>
                {`$${swap.amountIn.usdValueFormatted}`}
              </StyledText>
              <StyledText style={{ color: colors.subbedText }}>
                {`${swap.amountIn.formatted} ${swap.tokenIn.symbol}`}
              </StyledText>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Feather name="arrow-right" size={32} color={colors.subbedText} />
            </View>
            <View
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                rowGap: 8,
                flex: 1,
              }}
            >
              <TokenLogoWithChain
                logoURI={swap.tokenOut.logoURI}
                chainId={swap.chainId}
                size={64}
              />
              <StyledText style={{ color: colors.subbedText }}>
                {`$${swap.amountOut.usdValueFormatted}`}
              </StyledText>
              <StyledText style={{ color: colors.subbedText }}>
                {`${swap.amountOut.formatted} ${swap.tokenOut.symbol}`}
              </StyledText>
            </View>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'column',
            rowGap: 16,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Address address={swap.address} />
          <TxHash txHash={swap.txHash} chainId={swap.chainId} />
          <DateTime date={new Date(swap.timestamp)} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default SwapListItemSheet;
