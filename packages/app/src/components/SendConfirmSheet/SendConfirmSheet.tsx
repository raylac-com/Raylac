import Feather from '@expo/vector-icons/Feather';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hex } from 'viem';
import { View } from 'react-native';
import StyledText from '@/components/StyledText/StyledText';
import { Token, TokenAmount } from '@raylac/shared';
import WalletIconAddress from '../WalletIconAddress/WalletIconAddress';
import { shortenAddress } from '@/lib/utils';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import fontSizes from '@/lib/styles/fontSizes';
import colors from '@/lib/styles/colors';
import StyledButton from '../StyledButton/StyledButton';

export interface SendConfirmSheetProps {
  open: boolean;
  fromChainId: number;
  toChainId: number;
  token: Token;
  fromAddress: Hex;
  toAddress: Hex;
  amount: TokenAmount;
  onClose: () => void;
  onConfirm: () => void;
  isSending: boolean;
}

const FromCard = ({
  address,
  token,
  chainId,
}: {
  token: Token;
  chainId: number;
  address: Hex;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TokenLogoWithChain size={42} logoURI={token.logoURI} chainId={chainId} />
      <View>
        <WalletIconAddress address={address} fontSize={20} />
      </View>
    </View>
  );
};

const ToCard = ({
  address,
  token,
  chainId,
}: {
  address: Hex;
  token: Token;
  chainId: number;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View>
        <TokenLogoWithChain
          size={42}
          logoURI={token.logoURI}
          chainId={chainId}
        />
      </View>
      <StyledText
        style={{
          color: colors.border,
          fontSize: fontSizes.large,
          fontWeight: 'bold',
        }}
      >
        {`${shortenAddress(address)}`}
      </StyledText>
    </View>
  );
};

const SendConfirmSheet = ({
  open,
  fromChainId,
  toChainId,
  token,
  fromAddress,
  toAddress,
  amount,
  onClose,
  onConfirm,
  isSending,
}: SendConfirmSheetProps) => {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (open) {
      ref.current?.present();
    }
  }, [open]);

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
          rowGap: 24,
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: 'column', rowGap: 24 }}>
          <StyledText
            style={{ fontSize: fontSizes.twoXLarge, fontWeight: 'bold' }}
          >{`Send`}</StyledText>
          <View style={{ flexDirection: 'column', rowGap: 16 }}>
            <ToCard address={toAddress} token={token} chainId={toChainId} />
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <View
                style={{
                  width: 42,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Feather name="chevrons-up" size={32} color="black" />
              </View>
              <View style={{ flexDirection: 'column', rowGap: 4 }}>
                <StyledText
                  style={{ fontSize: fontSizes.large, fontWeight: 'bold' }}
                >{`$${amount.usdValueFormatted}`}</StyledText>
                <StyledText
                  style={{ fontSize: fontSizes.base, color: colors.border }}
                >{`${amount.formatted} ${token.symbol}`}</StyledText>
              </View>
            </View>
            <FromCard
              address={fromAddress}
              token={token}
              chainId={fromChainId}
            />
          </View>
          <StyledButton
            title="Confirm"
            onPress={onConfirm}
            isLoading={isSending}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default SendConfirmSheet;
