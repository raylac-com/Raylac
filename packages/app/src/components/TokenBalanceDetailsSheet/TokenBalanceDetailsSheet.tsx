import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import {
  formatAmount,
  formatUsdValue,
  TokenBalancesReturnType,
} from '@raylac/shared';
import StyledText from '../StyledText/StyledText';
import { Image, View } from 'react-native';
import TokenLogo from '../FastImage/TokenLogo';
import colors from '@/lib/styles/colors';
import { hexToBigInt } from 'viem';
import fontSizes from '@/lib/styles/fontSizes';
import { getChainIcon } from '@/lib/utils';
import BigNumber from 'bignumber.js';

const ChainTokenBalance = ({
  chainId,
  symbol,
  formattedBalance,
  usdValue,
}: {
  chainId: number;
  symbol: string;
  formattedBalance: string;
  usdValue: string;
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
          {formattedBalance} {symbol}
        </StyledText>
      </View>
      <StyledText>{`$${formatUsdValue(new BigNumber(usdValue))}`}</StyledText>
    </View>
  );
};

export interface TokenBalanceDetailsSheetProps {
  tokenBalance: TokenBalancesReturnType[number];
  onClose: () => void;
}

const TokenBalanceDetailsSheet = ({
  tokenBalance,
  onClose,
}: TokenBalanceDetailsSheetProps) => {
  const ref = useRef<BottomSheet>(null);
  return (
    <BottomSheet
      ref={ref}
      style={{
        flex: 1,
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
              source={{ uri: tokenBalance.token.logoURI }}
              style={{
                width: 90,
                height: 90,
              }}
            />
            <StyledText style={{ fontSize: fontSizes.large }}>
              {tokenBalance.token.name}
            </StyledText>
          </View>
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <StyledText>
              {formatAmount(
                hexToBigInt(tokenBalance.balance).toString(),
                tokenBalance.token.decimals
              )}
            </StyledText>
            <StyledText style={{ color: colors.subbedText }}>
              {`$${formatUsdValue(new BigNumber(tokenBalance.usdValue))}`}
            </StyledText>
          </View>
        </View>
        <View style={{ flexDirection: 'column', rowGap: 12 }}>
          {tokenBalance.breakdown.map((chainTokenBalance, i) => (
            <ChainTokenBalance
              key={i}
              chainId={chainTokenBalance.chainId}
              symbol={tokenBalance.token.symbol}
              formattedBalance={formatAmount(
                hexToBigInt(chainTokenBalance.balance).toString(),
                tokenBalance.token.decimals
              )}
              usdValue={chainTokenBalance.usdValue}
            />
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default TokenBalanceDetailsSheet;
