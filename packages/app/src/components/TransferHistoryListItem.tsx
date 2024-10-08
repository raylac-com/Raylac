import { shortenAddress } from '@/lib/utils';
import { Pressable, Text, View } from 'react-native';
import FastAvatar from './FastAvatar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { Hex } from 'viem';
import { formatAmount, getTokenMetadata } from '@raylac/shared';
import { trpc } from '@/lib/trpc';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { publicKeyToAddress } from 'viem/accounts';
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

  const chainId = transfer.traces[0].Transaction?.block?.chainId;
  const tokenId = transfer.traces[0].tokenId;

  const amount = transfer.traces.reduce(
    (acc, trace) => acc + BigInt(trace.amount),
    BigInt(0)
  );

  const { data: blockTimestamp } = trpc.getBlockTimestamp.useQuery({
    chainId,
    blockNumber: transfer.maxBlockNumber,
  });

  const tokenMeta = getTokenMetadata(tokenId);
  const formattedAmount = formatAmount(amount.toString(), tokenMeta.decimals);

  const navigation = useTypedNavigation();

  const transferUser =
    type === 'outgoing' ? transfer?.toUser : transfer?.fromUser;

  const avatarAddress = transferUser
    ? publicKeyToAddress(transferUser.spendingPubKey as Hex)
    : ((type === 'outgoing'
        ? transfer.toAddress
        : transfer.fromAddress) as Hex);

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
          transferId: transfer.transferId,
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
            imageUrl={transferUser ? transferUser.profileImage : undefined}
            size={36}
          ></FastAvatar>
          <Text
            style={{
              color: theme.text,
            }}
          >
            {transferUser
              ? transferUser.name
              : shortenAddress(
                  (type === 'outgoing'
                    ? transfer.toAddress
                    : transfer.fromAddress) as Hex
                )}
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
