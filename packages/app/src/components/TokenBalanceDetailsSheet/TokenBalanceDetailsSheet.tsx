import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import {
  getPerAddressTokenBalance,
  PerAddressTokenBalance,
  Token,
} from '@raylac/shared';
import StyledText from '../StyledText/StyledText';
import { View } from 'react-native';
import { Image } from 'expo-image';
import TokenLogo from '../FastImage/TokenLogo';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { getChainIcon } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTokenBalances from '@/hooks/useTokenBalances';
import { Balance } from '@raylac/shared/src/types';
import { Hex } from 'viem';
import WalletIconAddress from '../WalletIconAddress/WalletIconAddress';

const ChainTokenBalance = ({
  chainId,
  symbol,
  balance,
}: {
  chainId: number;
  symbol: string;
  balance: Balance;
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
        <Image
          source={getChainIcon(chainId)}
          style={{
            width: 24,
            height: 24,
          }}
        ></Image>
        <StyledText
          style={{
            color: colors.subbedText,
          }}
        >
          {balance.formatted} {symbol}
        </StyledText>
      </View>
      <StyledText>{`$${balance.usdValueFormatted}`}</StyledText>
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
    <View>
      <WalletIconAddress address={address} />
      {balance.chainBalances.map((chainTokenBalance, i) => (
        <ChainTokenBalance
          key={i}
          chainId={chainTokenBalance.chainId}
          symbol={token.symbol}
          balance={chainTokenBalance.balance}
        />
      ))}
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

  const { data: tokenBalances } = useTokenBalances();

  const perAddressBalances = getPerAddressTokenBalance({
    tokenBalances: tokenBalances ?? [],
    token,
  });

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
      enableDynamicSizing={false}
      snapPoints={['100%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          rowGap: 60,
          paddingTop: 32,
          paddingHorizontal: 42,
          paddingBottom: 32,
        }}
      >
        <View
          style={{
            width: '100%',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 32,
            paddingVertical: 26,
            borderWidth: 1,
            borderColor: colors.border,
            rowGap: 24,
          }}
        >
          <View
            style={{ flexDirection: 'column', alignItems: 'center', rowGap: 6 }}
          >
            <TokenLogo
              source={{ uri: token.logoURI }}
              style={{
                width: 90,
                height: 90,
              }}
            />
            <StyledText style={{ fontSize: fontSizes.large }}>
              {token.name}
            </StyledText>
          </View>
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <StyledText>{perAddressBalances.totalBalance.formatted}</StyledText>
            <StyledText style={{ color: colors.subbedText }}>
              {perAddressBalances.totalBalance.usdValueFormatted}
            </StyledText>
          </View>
        </View>
        <View style={{ flexDirection: 'column', rowGap: 12 }}>
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
      </BottomSheetView>
    </BottomSheet>
  );
};

export default TokenBalanceDetailsSheet;
