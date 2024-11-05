import FastAvatar from '@/components/FastAvatar';
import LinkText from '@/components/LinkText';
import TransferDetailListItem from '@/components/TransferDetailListItem';
import useSignedInUser from '@/hooks/useSignedInUser';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import {
  copyToClipboard,
  getAvatarAddress,
  getDisplayName,
  getFinalTransfer,
  getProfileImage,
  getTransferType,
  getUsdTransferAmount,
  shortenAddress,
} from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { TraceItem } from '@/types';
import { Entypo, Feather } from '@expo/vector-icons';
import {
  formatAmount,
  getBlockExplorerUrl,
  getTokenMetadata,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Hex } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'TransferDetails'>;

const TraceListItem = ({ trace }: { trace: TraceItem }) => {
  const from = trace.from as Hex;
  const to = trace.to as Hex;
  const amount = trace.amount as string;
  const chainId = trace.chainId;
  const txHash = trace.transactionHash as Hex;

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

const TransferDetails = ({ route }: Props) => {
  const { txHash } = route.params;
  const { data: signedInUser } = useSignedInUser();
  const [showTraces, setShowTraces] = useState(false);

  const { t } = useTranslation();

  const { data: transferDetail } = trpc.getTransferDetails.useQuery({
    txHash,
  });

  const blockTimestamp = new Date(
    Number(transferDetail?.block?.timestamp) * 1000
  );

  const tokenId = transferDetail?.traces[0].tokenId;

  const tokenMeta = getTokenMetadata(tokenId);

  if (!transferDetail) {
    return null;
  }

  const type = getTransferType(transferDetail, signedInUser.id);

  const finalTransfer = getFinalTransfer(transferDetail);

  const transferAmount = finalTransfer.amount as string;

  const transferUsdAmount = getUsdTransferAmount(transferDetail);

  const from = finalTransfer.UserStealthAddressFrom?.user || finalTransfer.from;
  const to = finalTransfer.UserStealthAddressTo?.user || finalTransfer.to;

  const avatarAddress =
    type === 'outgoing' ? getAvatarAddress(to) : getAvatarAddress(from);

  const profileImage =
    type === 'outgoing' ? getProfileImage(to) : getProfileImage(from);

  const displayName =
    type === 'outgoing' ? getDisplayName(to) : getDisplayName(from);

  const onCopyPress = () => {
    copyToClipboard(avatarAddress);
    Toast.show({
      type: 'success',
      text1: t('copied', { ns: 'common' }),
      position: 'bottom',
    });
  };

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
        address={avatarAddress}
        imageUrl={profileImage}
        size={80}
      ></FastAvatar>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
        onPress={onCopyPress}
      >
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
          }}
        >
          {type === 'outgoing' ? 'Sent to ' : 'Received from '}
          {displayName}
        </Text>
        <Feather name="copy" size={14} color={theme.text} />
      </Pressable>
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
      {transferUsdAmount && (
        <Text
          style={{
            color: theme.text,
            opacity: 0.5,
            fontSize: 16,
          }}
        >
          ~${transferUsdAmount}
        </Text>
      )}
      <Text
        style={{
          color: theme.text,
          opacity: 0.5,
        }}
      >
        {blockTimestamp.toLocaleString()}
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
            {displayName}
          </Text>
          {transferDetail.traces.map((trace, i) => (
            <TraceListItem trace={trace} key={i} />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default TransferDetails;
