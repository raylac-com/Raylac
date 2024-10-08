import FastAvatar from '@/components/FastAvatar';
import LinkText from '@/components/LinkText';
import TransferDetailListItem from '@/components/TransferDetailListItem';
import useSignedInUser from '@/hooks/useSignedInUser';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { TraceItem } from '@/types';
import { Entypo } from '@expo/vector-icons';
import {
  formatAmount,
  getBlockExplorerUrl,
  getTokenMetadata,
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

const TraceListItem = ({ trace }: { trace: TraceItem }) => {
  const from = trace.from as Hex;
  const to = trace.to as Hex;
  const amount = trace.amount as string;
  const chainId = trace.Transaction?.block?.chainId;
  const txHash = trace.Transaction.hash as Hex;

  const tokenId = trace.tokenId as string;
  const tokenMeta = getTokenMetadata(tokenId);

  return (
    <View>
      <TransferDetailListItem
        label="from"
        value={
          <LinkText
            text={shortenAddress(from)}
            url={`${getBlockExplorerUrl(chainId)}/address/${from}`}
          ></LinkText>
        }
      ></TransferDetailListItem>
      <TransferDetailListItem
        label="to"
        value={
          <LinkText
            text={shortenAddress(to)}
            url={`${getBlockExplorerUrl(chainId)}/address/${to}`}
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
            {formatAmount(amount, tokenMeta.decimals)} {tokenMeta.symbol}
          </Text>
        }
      ></TransferDetailListItem>
      <TransferDetailListItem
        label="txHash"
        value={
          <LinkText
            text={shortenAddress(txHash)}
            url={`${getBlockExplorerUrl(chainId)}/tx/${txHash}`}
          ></LinkText>
        }
      ></TransferDetailListItem>
    </View>
  );
};

const tryPublicKeyToAddress = (publicKey: Hex | undefined) => {
  if (!publicKey) {
    return undefined;
  }

  return publicKeyToAddress(publicKey);
};

const RaylacTransferDetails = ({ route }: Props) => {
  const { transferId } = route.params;
  const { data: signedInUser } = useSignedInUser();
  const [showTraces, setShowTraces] = useState(false);

  const { data: transferDetail } = trpc.getTransferDetails.useQuery({
    transferId,
  });

  const blockNumber = transferDetail?.maxBlockNumber;
  const chainId = transferDetail?.traces[0].Transaction.block.chainId;
  const tokenId = transferDetail?.traces[0].tokenId;

  const tokenMeta = getTokenMetadata(tokenId);

  const { data: timestamp } = trpc.getBlockTimestamp.useQuery(
    {
      blockNumber,
      chainId,
    },
    {
      enabled: !!blockNumber && !!chainId,
      throwOnError: false,
    }
  );

  const type =
    transferDetail?.fromUser?.id === signedInUser?.id ? 'outgoing' : 'incoming';

  const transferAmount = transferDetail?.traces.reduce((acc, trace) => {
    return acc + BigInt(trace.amount);
  }, BigInt(0));

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
          type === 'outgoing'
            ? tryPublicKeyToAddress(
                transferDetail.toUser?.spendingPubKey as Hex
              ) || transferDetail.toAddress
            : tryPublicKeyToAddress(
                transferDetail.fromUser?.spendingPubKey as Hex
              ) || transferDetail.fromAddress
        }
        imageUrl={
          type === 'outgoing'
            ? transferDetail.toUser?.profileImage
            : transferDetail.fromUser?.profileImage
        }
        size={80}
      ></FastAvatar>
      <Text
        style={{
          color: theme.text,
          fontSize: 14,
        }}
      >
        {type === 'outgoing' ? 'Sent to ' : 'Received from '}
        {type === 'outgoing'
          ? `${transferDetail.toUser?.name || shortenAddress(transferDetail.toAddress as Hex)}`
          : `${transferDetail.fromUser?.name || shortenAddress(transferDetail.fromAddress as Hex)}`}
      </Text>
      <Text
        style={{
          color: theme.text,
          fontSize: 24,
          fontWeight: 'bold',
        }}
      >
        {formatAmount(transferAmount.toString(), tokenMeta.decimals)}{' '}
        {tokenMeta.symbol}
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
            {type === 'outgoing' ? 'Sent to ' : 'Received from '}
            {type === 'outgoing'
              ? transferDetail.toUser?.username
              : transferDetail.fromUser?.username}
          </Text>
          {transferDetail.traces.map((trace, i) => (
            <TraceListItem trace={trace} key={i} />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default RaylacTransferDetails;
