import FastAvatar from '@/components/FastAvatar';
import LinkText from '@/components/LinkText';
import TransferDetailListItem from '@/components/TransferDetailListItem';
import useSignedInUser from '@/hooks/useSignedInUser';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { Entypo } from '@expo/vector-icons';
import {
  formatAmount,
  getBlockExplorerUrl,
  RaylacTransferDetailsReturnType,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

type Props = NativeStackScreenProps<
  RootStackParamsList,
  'RaylacTransferDetails'
>;

const TraceListItem = ({
  trace,
}: {
  trace: RaylacTransferDetailsReturnType['traces'][0];
}) => {
  return (
    <View>
      <TransferDetailListItem
        label="from"
        value={
          <LinkText
            text={shortenAddress(trace.from)}
            url={`${getBlockExplorerUrl(trace.chainId)}/address/${trace.from}`}
          ></LinkText>
        }
      ></TransferDetailListItem>
      <TransferDetailListItem
        label="to"
        value={
          <LinkText
            text={shortenAddress(trace.to)}
            url={`${getBlockExplorerUrl(trace.chainId)}/address/${trace.to}`}
          ></LinkText>
        }
      ></TransferDetailListItem>
      <TransferDetailListItem
        label="amount"
        value={
          <Text
            style={{
              color: theme.text,
            }}
          >
            {formatAmount(trace.amount, 18)} ETH
          </Text>
        }
      ></TransferDetailListItem>
      <TransferDetailListItem
        label="txHash"
        value={
          <LinkText
            text={shortenAddress(trace.txHash)}
            url={`${getBlockExplorerUrl(trace.chainId)}/tx/${trace.txHash}`}
          ></LinkText>
        }
      ></TransferDetailListItem>
    </View>
  );
};

const RaylacTransferDetails = ({ route }: Props) => {
  const { executionTag } = route.params;
  const { data: signedInUser } = useSignedInUser();
  const [showTraces, setShowTraces] = useState(false);

  const { data: transferDetail } = trpc.getRaylacTransferDetails.useQuery({
    executionTag,
  });

  const sortedTrace = transferDetail?.traces.sort((a, b) => {
    return Number(b.blockNumber) - Number(a.blockNumber);
  });

  const latestTrace = sortedTrace ? sortedTrace[0] : null;

  const { data: timestamp } = trpc.getBlockTimestamp.useQuery(
    {
      blockNumber: Number(latestTrace?.blockNumber),
      chainId: latestTrace?.chainId,
    },
    {
      enabled: !!latestTrace,
      throwOnError: false,
    }
  );

  const type =
    transferDetail?.fromUserId === signedInUser?.id ? 'outgoing' : 'incoming';

  const transferUserId =
    type === 'outgoing' ? transferDetail?.toUserId : transferDetail?.fromUserId;

  const { data: transferUser } = trpc.getUser.useQuery(
    {
      userId: transferUserId,
    },
    {
      enabled: !!transferUserId,
      throwOnError: false,
    }
  );

  if (!transferDetail) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        rowGap: 10,
      }}
      style={{
        backgroundColor: theme.background,
        paddingTop: 60,
      }}
    >
      <FastAvatar
        address={
          transferUser
            ? publicKeyToAddress(transferUser.spendingPubKey as Hex)
            : transferDetail.toAddress
        }
        imageUrl={transferUser?.profileImage}
        size={80}
      ></FastAvatar>
      <Text
        style={{
          color: theme.text,
          fontSize: 14,
        }}
      >
        {type === 'outgoing' ? 'Sent to ' : 'Received from '}
        {transferUser
          ? `${transferUser.name}`
          : shortenAddress(transferDetail.toAddress)}
      </Text>

      <Text
        style={{
          color: theme.text,
          fontSize: 24,
          fontWeight: 'bold',
        }}
      >
        {formatAmount(transferDetail.amount, 18)} ETH
      </Text>
      <Text
        style={{
          color: theme.text,
          opacity: 0.5,
        }}
      >
        {timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : ''}
      </Text>
      <Pressable
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          columnGap: 4,
          marginTop: 32,
        }}
        onPress={() => setShowTraces(!showTraces)}
      >
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          Traces
        </Text>
        <Entypo
          name={showTraces ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.gray}
        />
      </Pressable>

      {showTraces && (
        <View
          style={{
            rowGap: 10,
          }}
        >
          <Text
            style={{
              opacity: 0.6,
              color: theme.text,
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            {type === 'outgoing' ? 'Sent to ' : 'Received from '}@
            {transferUser.username}
          </Text>
          {transferDetail.traces.map((trace, i) => (
            <TraceListItem
              trace={trace as RaylacTransferDetailsReturnType['traces'][0]}
              key={i}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default RaylacTransferDetails;
