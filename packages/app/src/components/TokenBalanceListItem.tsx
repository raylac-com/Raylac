import useTypedNavigation from '@/hooks/useTypedNavigation';
import avatarSizes from '@/lib/styles/avatarSizes';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import opacity from '@/lib/styles/opacity';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import {
  formatAmount,
  getTokenMetadata,
  toCoingeckoTokenId,
} from '@raylac/shared';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import { formatUnits } from 'viem';

interface TokenBalanceListItemProps {
  tokenId: string;
  balance: bigint;
}

const TokenBalanceListItem = (props: TokenBalanceListItemProps) => {
  const navigation = useTypedNavigation();

  const { tokenId, balance } = props;
  const { data: tokenPrices } = trpc.getTokenPrices.useQuery();

  const tokenMetadata = getTokenMetadata(tokenId);

  const tokenPrice =
    tokenId === 'usdc'
      ? { usd: 1 }
      : tokenPrices
        ? tokenPrices[toCoingeckoTokenId(tokenId)]
        : null;

  const usdBalance = tokenPrice
    ? tokenPrice.usd! * parseFloat(formatUnits(balance, tokenMetadata.decimals))
    : null;

  const formattedBalance = formatAmount(
    balance.toString(),
    tokenMetadata.decimals
  );

  const formattedUsdBalance = usdBalance ? usdBalance.toFixed(2) : null;

  const { t } = useTranslation();

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: spacing.base,
        borderBottomWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.small,
      }}
      onPress={() => {
        navigation.navigate('TokenBalanceDetails', {
          tokenId,
        });
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xSmall,
        }}
      >
        <Image
          source={{ uri: tokenMetadata.logoURI }}
          style={{
            width: avatarSizes.small,
            height: avatarSizes.small,
          }}
        />
        <Text
          style={{
            fontSize: fontSizes.base,
            color: colors.text,
            fontWeight: 'bold',
          }}
        >
          {tokenMetadata.name}
        </Text>
      </View>
      <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.base,
          }}
        >
          {t('fiatDenominatedBalance', {
            balance: formattedUsdBalance,
            ns: 'common',
          })}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.base,
            opacity: opacity.dimmed,
          }}
        >
          {`${formattedBalance} ${tokenMetadata.symbol}`}
        </Text>
      </View>
    </Pressable>
  );
};

export default TokenBalanceListItem;
