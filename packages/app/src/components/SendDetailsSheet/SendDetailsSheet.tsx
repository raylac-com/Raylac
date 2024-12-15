import colors from '@/lib/styles/colors';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import TokenImageWithChain from '@/components/TokenImageWithChain/TokenImageWithChain';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BuildMultiChainSendReturnType, Token } from '@raylac/shared';
import { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '../StyledText/StyledText';
import { shortenAddress } from '@/lib/utils';
import fontSizes from '@/lib/styles/fontSizes';

const TokenAmountOnChain = ({
  token,
  chainId,
  amountFormatted,
}: {
  token: Token;
  chainId: number;
  amountFormatted: string;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
      <TokenImageWithChain logoURI={token.logoURI} chainId={chainId} />
      <StyledText>
        {amountFormatted} {token.symbol}
      </StyledText>
    </View>
  );
};

const BridgeListItem = ({
  token,
  bridge,
}: {
  token: Token;
  bridge: BuildMultiChainSendReturnType['bridgeSteps'][number];
}) => {
  return (
    <View
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        rowGap: 8,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <TokenAmountOnChain
          token={token}
          chainId={bridge.bridgeDetails.fromChainId}
          amountFormatted={bridge.bridgeDetails.amountInFormatted}
        />
        <MaterialIcons
          name="keyboard-double-arrow-right"
          size={24}
          color={colors.subbedText}
        />
        <TokenAmountOnChain
          token={token}
          chainId={bridge.bridgeDetails.toChainId}
          amountFormatted={bridge.bridgeDetails.amountOutFormatted}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        <StyledText style={{ color: colors.subbedText }}>
          {`Fee ${bridge.bridgeDetails.bridgeFeeFormatted} ${token.symbol} ($${bridge.bridgeDetails.bridgeFeeUsd})`}
        </StyledText>
      </View>
    </View>
  );
};

const TransferListItem = ({
  token,
  transfer,
}: {
  token: Token;
  transfer: BuildMultiChainSendReturnType['transferStep'];
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
      }}
    >
      {/* Transfer input */}
      <View style={{ flexDirection: 'column', rowGap: 8 }}>
        <StyledText>{`You send`}</StyledText>
        <TokenAmountOnChain
          token={token}
          chainId={transfer.transferDetails.chainId}
          amountFormatted={transfer.transferDetails.amountFormatted}
        />
      </View>
      <MaterialCommunityIcons
        name="transfer-right"
        size={24}
        color={colors.subbedText}
      />
      {/* Transfer output */}
      <View style={{ flexDirection: 'column', rowGap: 8 }}>
        <StyledText>{`${shortenAddress(transfer.transferDetails.to)} receives`}</StyledText>
        <TokenAmountOnChain
          token={token}
          chainId={transfer.transferDetails.chainId}
          amountFormatted={transfer.transferDetails.amountFormatted}
        />
      </View>
    </View>
  );
};

export interface SendDetailsSheetProps {
  sendDetails: BuildMultiChainSendReturnType;
  token: Token;
  onClose: () => void;
}

const SendDetailsSheet = ({
  sendDetails,
  token,
  onClose,
}: SendDetailsSheetProps) => {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      ref={ref}
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      index={0}
      onClose={onClose}
      enablePanDownToClose
      snapPoints={['100%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'flex-start',
          rowGap: 24,
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
      >
        <StyledText
          style={{ fontWeight: 'bold', fontSize: fontSizes.large }}
        >{`Transfer details`}</StyledText>
        <View style={{ flexDirection: 'column', rowGap: 8, width: '100%' }}>
          <StyledText>{`Bridging`}</StyledText>
          {sendDetails.bridgeSteps.map(bridge => (
            <BridgeListItem
              key={bridge.bridgeDetails.fromChainId}
              token={token}
              bridge={bridge}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'column', rowGap: 8, width: '100%' }}>
          <StyledText>{`Transfer`}</StyledText>
          <TransferListItem token={token} transfer={sendDetails.transferStep} />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default SendDetailsSheet;
