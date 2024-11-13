import {
  getAvatarAddress,
  getDisplayName,
  getFinalTransfer,
  getProfileImage,
  getUsdTransferAmount,
} from '@/lib/utils';
import { Pressable, Text, View } from 'react-native';
import FastAvatar from './FastAvatar';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/lib/styles/colors';
import { formatAmount, getTokenMetadata } from '@raylac/shared';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { formatDistanceToNowStrict, Locale } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { TransferItem } from '@/types';
import { useTranslation } from 'react-i18next';
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

  const tokenId = transfer.traces[0].tokenId;

  const finalTransfer = getFinalTransfer(transfer);
  const { i18n } = useTranslation();

  const amount = finalTransfer.amount as string;

  const tokenMeta = getTokenMetadata(tokenId);
  const formattedAmount = formatAmount(amount, tokenMeta.decimals);

  const navigation = useTypedNavigation();

  const from = finalTransfer.UserStealthAddressFrom?.user || finalTransfer.from;
  const to = finalTransfer.UserStealthAddressTo?.user || finalTransfer.to;

  const avatarAddress =
    type === 'outgoing' ? getAvatarAddress(to) : getAvatarAddress(from);

  const blockTimestamp = new Date(Number(transfer.block.timestamp) * 1000);

  const transferUsdAmount = getUsdTransferAmount(transfer);

  return (
    <Pressable
      style={{
        flex: 1,
        flexDirection: 'column',
        borderBottomWidth: 1,
        paddingVertical: 12,
        rowGap: 4,
      }}
      onPress={() => {
        navigation.navigate('TransferDetails', {
          txHash: transfer.hash,
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
            columnGap: 8,
          }}
        >
          <FastAvatar
            address={avatarAddress}
            imageUrl={
              type === 'outgoing' ? getProfileImage(to) : getProfileImage(from)
            }
            size={36}
          ></FastAvatar>
          <Text
            style={{
              color: colors.text,
            }}
          >
            {getDisplayName(type === 'outgoing' ? to : from)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'flex-end',
            rowGap: 4,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: 4,
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
                fontSize: 16,
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
                opacity: 0.5,
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
          opacity: 0.5,
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
