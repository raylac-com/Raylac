import { getChainLogo } from '@/lib/logo';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { formatAmount, getTokenMetadata, SupportedToken } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import { Hex } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'TokenBalanceDetails'>;

const AddressBalanceListItem = ({
  address,
  balance,
  token,
  chainId,
}: {
  address: Hex;
  balance: string;
  token: SupportedToken;
  chainId: number;
}) => {
  const formattedBalance = formatAmount(balance, token.decimals);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.xSmall,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          columnGap: spacing.xSmall,
          alignItems: 'center',
        }}
      >
        <Image
          source={getChainLogo(chainId)}
          style={{ width: 24, height: 24 }}
        />
        <Text
          style={{
            fontSize: fontSizes.base,
            color: colors.subbedText,
          }}
        >
          {shortenAddress(address)}
        </Text>
      </View>
      <Text
        style={{
          fontSize: fontSizes.base,
          color: colors.subbedText,
        }}
      >
        {formattedBalance} {token.symbol}
      </Text>
    </View>
  );
};

const TokenBalanceDetails = ({ route }: Props) => {
  const { t } = useTranslation('TokenBalanceDetails');

  const { tokenId } = route.params;

  const { data: tokenBalanceDetails } = trpc.getTokenBalanceDetails.useQuery({
    tokenId,
  });

  if (!tokenBalanceDetails) {
    return null;
  }

  const tokenMetadata = getTokenMetadata(tokenId);

  const totalBalance = tokenBalanceDetails.reduce(
    (acc, curr) => acc + BigInt(curr.balance),
    BigInt(0)
  );

  const formattedTotalBalance = formatAmount(
    totalBalance.toString(),
    tokenMetadata.decimals
  );

  return (
    <View
      style={{
        flexDirection: 'column',
        rowGap: spacing.large,
        padding: spacing.base,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          rowGap: spacing.small,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: spacing.xSmall,
          }}
        >
          <Image
            alt={`${tokenMetadata.name} logo`}
            source={{ uri: tokenMetadata.logoURI }}
            style={{ width: 30, height: 30 }}
          />
          <Text
            style={{
              fontSize: fontSizes.large,
              fontWeight: 'bold',
              color: colors.text,
            }}
          >
            {tokenMetadata.name}
          </Text>
        </View>
        <Text
          style={{
            fontSize: fontSizes.large,
            color: colors.text,
            fontWeight: 'bold',
          }}
        >
          {formattedTotalBalance} {tokenMetadata.symbol}
        </Text>
      </View>
      <View style={{ flexDirection: 'column', rowGap: spacing.base }}>
        {/* Address list */}
        <Text
          style={{
            fontSize: fontSizes.base,
            color: colors.text,
            fontWeight: 'bold',
          }}
        >
          {t('addresses')}
        </Text>
        <View style={{ flexDirection: 'column', rowGap: spacing.small }}>
          {tokenBalanceDetails.map((balance, i) => (
            <AddressBalanceListItem
              key={i}
              address={balance.address}
              balance={balance.balance}
              token={tokenMetadata}
              chainId={balance.chainId}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default TokenBalanceDetails;
