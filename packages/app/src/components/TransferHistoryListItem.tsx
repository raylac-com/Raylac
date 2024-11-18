import { getAvatarAddress, getDisplayName, getProfileImage } from '@/lib/utils';
import { Pressable, Text, View } from 'react-native';
import FastAvatar from './FastAvatar';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/lib/styles/colors';
import { formatAmount, getTokenMetadata } from '@raylac/shared';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { formatDistanceToNowStrict, Locale } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { AddressOrUser, TransferItem } from '@/types';
import { useTranslation } from 'react-i18next';
import spacing from '@/lib/styles/spacing';
import fontSizes from '@/lib/styles/fontSizes';
import opacity from '@/lib/styles/opacity';
import avatarSizes from '@/lib/styles/avatarSizes';
// import useEnsName from '@/hooks/useEnsName';

interface TransferHistoryListItemProps {
  transfer: TransferItem;
  type: 'incoming' | 'outgoing';
}

const formatDate = ({
  timestamp,
  locale,
}: {
  timestamp: Date;
  locale: Locale;
}) => {
  return formatDistanceToNowStrict(timestamp, { addSuffix: true, locale });
};

const TransferHistoryListItem = (props: TransferHistoryListItemProps) => {
  const { transfer, type } = props;

  const tokenId = transfer.transactions[0].traces[0].tokenId;

  const { i18n } = useTranslation();

  const amount = transfer.amount;

  const tokenMeta = getTokenMetadata(tokenId);
  const formattedAmount = formatAmount(amount, tokenMeta.decimals);

  const navigation = useTypedNavigation();

  const from = (transfer.fromUser || transfer.fromAddress) as AddressOrUser;
  const to = (transfer.toUser || transfer.toAddress) as AddressOrUser;

  const avatarAddress =
    type === 'outgoing' ? getAvatarAddress(to) : getAvatarAddress(from);

  const blockTimestamp = new Date(Number(transfer.timestamp) * 1000);

  const transferUsdAmount = transfer.usdAmount;

  return (
    <Pressable
      style={{
        flex: 1,
        flexDirection: 'column',
        borderBottomWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.small,
        rowGap: spacing.xxSmall,
      }}
      onPress={() => {
        navigation.navigate('TransferDetails', {
          transferId: transfer.id,
        });
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: spacing.xSmall,
          }}
        >
          <FastAvatar
            address={avatarAddress}
            imageUrl={
              type === 'outgoing' ? getProfileImage(to) : getProfileImage(from)
            }
            size={avatarSizes.small}
          ></FastAvatar>
          <Text
            style={{
              color: colors.text,
              fontWeight: 'bold',
            }}
          >
            {getDisplayName(type === 'outgoing' ? to : from)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'flex-end',
            rowGap: spacing.xxSmall,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: spacing.xxSmall,
            }}
          >
            <Ionicons
              name={
                type === 'outgoing' ? 'arrow-up-outline' : 'arrow-down-outline'
              }
              size={18}
              color={type === 'outgoing' ? colors.warning : colors.green}
            />
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: fontSizes.base,
                color: type === 'incoming' ? colors.green : colors.warning,
              }}
            >
              {formattedAmount} {tokenMeta.symbol}
            </Text>
          </View>
          {transferUsdAmount && (
            <Text
              style={{
                color: colors.text,
                textAlign: 'right',
                opacity: opacity.dimmed,
              }}
              // eslint-disable-next-line react/jsx-no-literals
            >
              ~${transferUsdAmount}
            </Text>
          )}
        </View>
      </View>
      <Text
        style={{
          color: colors.text,
          textAlign: 'right',
          opacity: opacity.dimmed,
        }}
      >
        {blockTimestamp
          ? formatDate({
              timestamp: blockTimestamp,
              locale: i18n.language === 'ja' ? ja : enUS,
            })
          : ''}
      </Text>
    </Pressable>
  );
};

export default TransferHistoryListItem;
