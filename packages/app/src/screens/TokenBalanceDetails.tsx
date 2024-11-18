import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { formatAmount, getTokenMetadata } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Text, View } from 'react-native';
import { Hex } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'TokenBalanceDetails'>;

const AddressBalanceListItem = ({
  address,
  formattedBalance,
}: {
  address: Hex;
  formattedBalance: string;
}) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: fontSizes.small, color: colors.text }}>
        {shortenAddress(address)}
      </Text>
      <Text style={{ fontSize: fontSizes.small, color: colors.text }}>
        {formattedBalance}
      </Text>
    </View>
  );
};

const TokenBalanceDetails = ({ route }: Props) => {
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
        rowGap: spacing.base,
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
        <Text style={{ fontSize: fontSizes.large, color: colors.text }}>
          {formattedTotalBalance} {tokenMetadata.symbol}
        </Text>
      </View>
      {/* Address list */}
      <View style={{ flexDirection: 'column', rowGap: spacing.small }}>
        {tokenBalanceDetails.map((balance, i) => (
          <AddressBalanceListItem
            key={i}
            address={balance.address}
            formattedBalance={formatAmount(
              balance.balance,
              tokenMetadata.decimals
            )}
          />
        ))}
      </View>
    </View>
  );
};

export default TokenBalanceDetails;
