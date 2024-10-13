import {
  getAvatarAddress,
  getDisplayName,
  getFinalTransfer,
  getProfileImage,
} from '@/lib/utils';
import { Pressable, Text, View } from 'react-native';
import FastAvatar from './FastAvatar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { formatAmount, getTokenMetadata } from '@raylac/shared';
import { trpc } from '@/lib/trpc';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { formatDistanceToNowStrict } from 'date-fns';
import { TransferItem } from '@/types';
// import useEnsName from '@/hooks/useEnsName';

interface TransferHistoryListItemProps {
  transfer: TransferItem;
  type: 'incoming' | 'outgoing';
}

const formatDate = (date: Date) => {
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

const TransferHistoryListItem = (props: TransferHistoryListItemProps) => {
  const { transfer, type } = props;

  const chainId = transfer.traces[0].chainId;
  const tokenId = transfer.traces[0].tokenId;

  const { data: blockTimestamp } = trpc.getBlockTimestamp.useQuery({
    chainId,
    blockNumber: Number(transfer.block.number),
  });

  const finalTransfer = getFinalTransfer(transfer);

  const amount = finalTransfer.amount as string;

  const tokenMeta = getTokenMetadata(tokenId);
  const formattedAmount = formatAmount(amount, tokenMeta.decimals);

  const navigation = useTypedNavigation();

  const from = finalTransfer.UserStealthAddressFrom?.user || finalTransfer.from;
  const to = finalTransfer.UserStealthAddressTo?.user || finalTransfer.to;

  const avatarAddress =
    type === 'outgoing' ? getAvatarAddress(to) : getAvatarAddress(from);

  return (
    <Pressable
      style={{
        flex: 1,
        flexDirection: 'column',
        borderBottomWidth: 1,
        paddingVertical: 12,
      }}
      onPress={() => {
        navigation.navigate('RaylacTransferDetails', {
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
              color: theme.text,
            }}
          >
            {getDisplayName(type === 'outgoing' ? to : from)}
          </Text>
        </View>
        <View>
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
              color={type === 'outgoing' ? theme.waning : theme.green}
            />
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 16,
                color: type === 'incoming' ? theme.green : theme.waning,
              }}
            >
              {formattedAmount} {tokenMeta.symbol}
            </Text>
          </View>
          {/**
              <Text
            style={{
              fontWeight: 'bold',
              fontSize: 12,
              color: theme.gray,
              textAlign: 'right',
            }}
          >
            {formattedUsdAmount} USD
          </Text>
             */}
        </View>
      </View>
      <Text
        style={{
          color: theme.text,
          textAlign: 'right',
          opacity: 0.5,
        }}
      >
        {blockTimestamp
          ? formatDate(new Date(Number(blockTimestamp) * 1000))
          : ''}
      </Text>
    </Pressable>
  );
};

export default TransferHistoryListItem;
