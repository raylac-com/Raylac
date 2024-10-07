import { shortenAddress } from '@/lib/utils';
import { Pressable, Text, View } from 'react-native';
import FastAvatar from './FastAvatar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { Hex } from 'viem';
import { TransferHistoryQueryResult, formatAmount } from '@raylac/shared';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { trpc } from '@/lib/trpc';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { publicKeyToAddress } from 'viem/accounts';
import { formatDistanceToNowStrict } from 'date-fns';
// import useEnsName from '@/hooks/useEnsName';

/**
 *  Get the token metadata for a given token ID
 */
const getTokenMetadata = (tokenId: string) => {
  return supportedTokens.find(token => token.tokenId === tokenId);
};

interface TransferHistoryListItemProps {
  tx: TransferHistoryQueryResult;
  type: 'incoming' | 'outgoing';
}

const formatDate = (date: Date) => {
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

const TransferHistoryListItem = (props: TransferHistoryListItemProps) => {
  const { tx, type } = props;

  const { data: blockTimestamp } = trpc.getBlockTimestamp.useQuery({
    chainId: tx.chainId,
    blockNumber: tx.blockNumber,
  });

  const tokenMeta = getTokenMetadata(tx.tokenId);
  const formattedAmount = formatAmount(tx.amount, tokenMeta.decimals);

  const navigation = useTypedNavigation();

  const transferUserId = type === 'outgoing' ? tx?.toUserId : tx?.fromUserId;

  const { data: transferUser } = trpc.getUser.useQuery(
    {
      userId: transferUserId,
    },
    {
      enabled: !!transferUserId,
      throwOnError: false,
    }
  );

  const avatarAddress = transferUser
    ? publicKeyToAddress(transferUser.spendingPubKey as Hex)
    : ((type === 'outgoing' ? tx.to : tx.from) as Hex);

  return (
    <Pressable
      style={{
        flex: 1,
        flexDirection: 'column',
        borderBottomWidth: 1,
        paddingVertical: 12,
      }}
      onPress={() => {
        if (tx.executionTag) {
          navigation.navigate('RaylacTransferDetails', {
            executionTag: tx.executionTag,
          });
        } else if (tx.txIndex && tx.logIndex) {
          navigation.navigate('IncomingERC20TransferDetails', {
            txIndex: tx.txIndex,
            logIndex: tx.logIndex,
            blockNumber: tx.blockNumber,
            chainId: tx.chainId,
          });
        } else {
          navigation.navigate('NativeTransferDetails', {
            txHash: tx.txHash,
            traceAddress: tx.traceAddress,
          });
        }
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
              : shortenAddress((type === 'outgoing' ? tx.to : tx.from) as Hex)}
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
