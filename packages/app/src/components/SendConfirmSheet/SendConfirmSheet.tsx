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
  inputAmount: TokenAmount;
  outputAmount: TokenAmount;
  onClose: () => void;
  onConfirm: () => void;
  isSending: boolean;
}

const FromCard = ({
  address,
  token,
  chainId,
  amount,
}: {
  token: Token;
  chainId: number;
  address: Hex;
  amount: TokenAmount;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <TokenLogoWithChain size={52} logoURI={token.logoURI} chainId={chainId} />
      <View style={{ flexDirection: 'column', rowGap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <StyledText style={{ fontSize: fontSizes.large, fontWeight: 'bold' }}>
            {`$${amount.usdValueFormatted} `}
          </StyledText>
          <StyledText
            style={{ fontSize: fontSizes.large, color: colors.border }}
          >
            {`${amount.formatted} ${token.symbol}`}
          </StyledText>
        </View>
        <WalletIconAddress address={address} />
      </View>
    </View>
  );
};

const ToCard = ({
  address,
  token,
  amount,
  chainId,
}: {
  address: Hex;
  token: Token;
  chainId: number;
  amount: TokenAmount;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <TokenLogoWithChain size={52} logoURI={token.logoURI} chainId={chainId} />
      <View style={{ flexDirection: 'column', rowGap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <StyledText style={{ fontSize: fontSizes.large, fontWeight: 'bold' }}>
            {`$${amount.usdValueFormatted} `}
          </StyledText>
          <StyledText
            style={{ fontSize: fontSizes.large, color: colors.border }}
          >
            {`${amount.formatted} ${token.symbol}`}
          </StyledText>
        </View>
        <StyledText style={{ color: colors.border }}>
          {shortenAddress(address)}
        </StyledText>
      </View>
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
  inputAmount,
  outputAmount,
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
            <ToCard
              address={toAddress}
              token={token}
              chainId={toChainId}
              amount={outputAmount}
            />
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <View
                style={{
                  width: 52,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Feather name="chevrons-up" size={32} color="black" />
              </View>
            </View>
            <FromCard
              address={fromAddress}
              token={token}
              chainId={fromChainId}
              amount={inputAmount}
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
