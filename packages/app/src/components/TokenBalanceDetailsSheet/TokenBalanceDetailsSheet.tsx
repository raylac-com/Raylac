import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Feather from '@expo/vector-icons/Feather';
import { useRef } from 'react';
import {
  getPerAddressTokenBalance,
  PerAddressTokenBalance,
  Token,
} from '@raylac/shared';
import StyledText from '../StyledText/StyledText';
import { View } from 'react-native';
import TokenLogo from '../TokenLogo/TokenLogo';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTokenBalances from '@/hooks/useTokenBalances';
import { TokenAmount } from '@raylac/shared/src/types';
import { Hex } from 'viem';
import WalletIconAddress from '../WalletIconAddress/WalletIconAddress';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import StyledButton from '../StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';

const ChainTokenBalance = ({
  chainId,
  token,
  balance,
}: {
  chainId: number;
  token: Token;
  balance: TokenAmount;
}) => {
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <TokenLogoWithChain
          chainId={chainId}
          logoURI={token.logoURI}
          size={24}
        />
        <StyledText
          style={{
            fontWeight: 'bold',
            color: colors.subbedText,
          }}
        >{`$${balance.usdValueFormatted}`}</StyledText>
      </View>
      <StyledText
        style={{
          color: colors.subbedText,
        }}
      >
        {balance.formatted} {token.symbol}
      </StyledText>
    </View>
  );
};

const AddressTokenBalance = ({
  address,
  token,
  balance,
}: {
  address: Hex;
  token: Token;
  balance: PerAddressTokenBalance['perAddressBreakdown'][number];
}) => {
  return (
    <View style={{ flexDirection: 'column', rowGap: 8 }}>
      <WalletIconAddress address={address} />
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
        {balance.chainBalances.map((chainTokenBalance, i) => (
          <ChainTokenBalance
            key={i}
            chainId={chainTokenBalance.chainId}
            token={token}
            balance={chainTokenBalance.balance}
          />
        ))}
      </View>
    </View>
  );
};

export interface TokenBalanceDetailsSheetProps {
  token: Token;
  onClose: () => void;
}

const TokenBalanceDetailsSheet = ({
  token,
  onClose,
}: TokenBalanceDetailsSheetProps) => {
  const ref = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const navigation = useTypedNavigation();

  const { data: tokenBalances } = useTokenBalances();

  const perAddressBalances = getPerAddressTokenBalance({
    tokenBalances: tokenBalances ?? [],
    token,
  });

  const onSendPress = () => {
    onClose();
    navigation.navigate('SelectRecipient');
  };

  const onSwapPress = () => {
    onClose();
    navigation.navigate('Tabs', {
      screen: 'Swap',
      params: {
        fromToken: token,
      },
    });
  };

  const onBridgePress = () => {
    onClose();

    navigation.navigate('Tabs', {
      screen: 'Swap',
      params: {
        fromToken: token,
        bridge: true,
      },
    });
  };

  const canBridge = token.addresses.length > 1;

  return (
    <BottomSheet
      ref={ref}
      style={{
        paddingTop: insets.top,
      }}
      onClose={onClose}
      enablePanDownToClose
      index={0}
      enableDynamicSizing={false}
      snapPoints={['100%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, flexDirection: 'column', rowGap: 32 }}>
            <View
              style={{
                width: '100%',
                flexDirection: 'column',
                borderRadius: 32,
                paddingVertical: 26,
                rowGap: 24,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 8,
                }}
              >
                <TokenLogo
                  source={{ uri: token.logoURI }}
                  style={{
                    width: 24,
                    height: 24,
                  }}
                />
                <StyledText>{token.name}</StyledText>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                <StyledText
                  style={{ fontSize: fontSizes.xLarge, fontWeight: 'bold' }}
                >
                  {`$${perAddressBalances.totalBalance.usdValueFormatted}`}
                </StyledText>
                <StyledText style={{ color: colors.subbedText }}>
                  {perAddressBalances.totalBalance.formatted} {token.symbol}
                </StyledText>
              </View>
            </View>
            <View style={{ flexDirection: 'column', rowGap: 48 }}>
              {perAddressBalances.perAddressBreakdown.map(
                (addressTokenBalance, i) => (
                  <AddressTokenBalance
                    key={i}
                    address={addressTokenBalance.address}
                    token={token}
                    balance={addressTokenBalance}
                  />
                )
              )}
            </View>
          </View>
          <View
            style={{ flexDirection: 'column', rowGap: 8, paddingBottom: 32 }}
          >
            {canBridge && (
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  columnGap: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <StyledButton
                    variant="outline"
                    icon={
                      <Feather name="zap" size={18} color={colors.border} />
                    }
                    title="Bridge"
                    onPress={onBridgePress}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledButton
                    icon={
                      <Feather name="repeat" size={18} color={colors.border} />
                    }
                    title="Swap"
                    onPress={onSwapPress}
                  />
                </View>
              </View>
            )}
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                columnGap: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <StyledButton
                  variant="outline"
                  icon={<Feather name="send" size={18} color={colors.border} />}
                  title="Send"
                  onPress={onSendPress}
                />
              </View>
              {!canBridge && (
                <View style={{ flex: 1 }}>
                  <StyledButton
                    icon={
                      <Feather name="repeat" size={18} color={colors.border} />
                    }
                    title="Swap"
                    onPress={onSwapPress}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default TokenBalanceDetailsSheet;
