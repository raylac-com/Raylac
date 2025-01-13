import Feather from '@expo/vector-icons/Feather';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { getExplorerUrl, BridgeTransferHistoryItem } from '@raylac/shared';
import { useEffect, useRef } from 'react';
import { getCurrencyFormattedValue } from '@/lib/utils';
import useSelectedCurrency from '@/hooks/useSelectedCurrency';
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

export interface BridgeTransferListItemSheetProps {
  transfer: BridgeTransferHistoryItem;
  onClose: () => void;
}

const shortenTxHash = (txHash: string) => {
  return `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
};

const FromAddress = ({ address }: { address: Hex }) => {
  const { data: senderEnsName } = useEnsName(address);
  const { t } = useTranslation('BridgeTransferListItemSheet');
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
      <StyledText style={{ color: colors.subbedText }}>{t('from')} </StyledText>
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

const ToAddress = ({ address }: { address: Hex }) => {
  const { data: recipientEnsName } = useEnsName(address);
  const { t } = useTranslation('BridgeTransferListItemSheet');
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
      <StyledText style={{ color: colors.subbedText }}>{t('to')} </StyledText>
      <FeedbackPressable
        onPress={onCopyPress}
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <Feather name="copy" size={18} color={colors.subbedText} />
        <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
          {recipientEnsName ?? shortenAddress(address)}
        </StyledText>
      </FeedbackPressable>
    </Pressable>
  );
};

const TxHash = ({ txHash, chainId }: { txHash: string; chainId: number }) => {
  const { t } = useTranslation('BridgeTransferListItemSheet');
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
        <ChainLogo chainId={chainId} size={16} />
        <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
          {`${shortenTxHash(txHash)}`}
        </StyledText>
      </View>
    </FeedbackPressable>
  );
};

const DateTime = ({ date }: { date: Date }) => {
  const { t } = useTranslation('BridgeTransferListItemSheet');
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

const BridgeTransferListItemSheet = ({
  transfer,
  onClose,
}: BridgeTransferListItemSheetProps) => {
  const insets = useSafeAreaInsets();
  const { data: selectedCurrency } = useSelectedCurrency();
  const ref = useRef<BottomSheetModal>(null);

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
        >{`${transfer.direction === 'incoming' ? 'Received' : 'Send'} details`}</StyledText>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 16,
          }}
        >
          <TokenLogoWithChain
            logoURI={transfer.token.logoURI}
            chainId={
              transfer.direction === 'incoming'
                ? transfer.toChainId
                : transfer.fromChainId
            }
            size={64}
          />
          <StyledText
            style={{ fontSize: fontSizes.xLarge, fontWeight: 'bold' }}
          >
            {getCurrencyFormattedValue(transfer.amount, selectedCurrency)}
          </StyledText>
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
          <FromAddress address={transfer.from} />
          <ToAddress address={transfer.to} />
          <TxHash txHash={transfer.inTxHash} chainId={transfer.fromChainId} />
          <TxHash txHash={transfer.outTxHash} chainId={transfer.toChainId} />
          <DateTime date={new Date(transfer.timestamp)} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default BridgeTransferListItemSheet;
