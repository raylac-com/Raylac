import FastAvatar from '@/components/FastAvatar';
import LinkText from '@/components/LinkText';
import TransferDetailListItem from '@/components/TransferDetailListItem';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import opacity from '@/lib/styles/opacity';
import { trpc } from '@/lib/trpc';
import {
  copyToClipboard,
  getAvatarAddress,
  getDisplayName,
  getNameIfUser,
  getProfileImage,
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
              color: colors.text,
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
  const { transferId } = route.params;
  const [showTraces, setShowTraces] = useState(false);

  const { t } = useTranslation('TransferDetails');

  const { data: transferDetail } = trpc.getTransferDetails.useQuery({
    transferId,
  });

  if (!transferDetail) {
    return null;
  }

  const blockTimestamp = new Date(Number(transferDetail?.timestamp) * 1000);

  const tokenId = transferDetail?.transactions[0].traces[0].tokenId;

  const tokenMeta = getTokenMetadata(tokenId);

  const from = transferDetail?.fromUser || transferDetail?.fromAddress;

  const to = transferDetail?.toUser || transferDetail?.toAddress;

  const type = transferDetail.transferType;

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
      text1: t('copiedAddress', { ns: 'common' }),
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
        backgroundColor: colors.background,
        paddingTop: 60,
      }}
    >
      <FastAvatar
        name={type === 'outgoing' ? getNameIfUser(to) : getNameIfUser(from)}
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
            color: colors.text,
            fontSize: 14,
          }}
        >
          {type === 'outgoing'
            ? t('sentTo', { name: displayName })
            : t('receivedFrom', { name: displayName })}
        </Text>
        <Feather name="copy" size={14} color={colors.text} />
      </Pressable>
      <Text
        style={{
          color: colors.text,
          fontSize: 24,
          fontWeight: 'bold',
        }}
      >
        {formatAmount(transferDetail.amount, tokenMeta.decimals)}{' '}
        {tokenMeta.symbol}
      </Text>
      {transferDetail.usdAmount && (
        <Text
          style={{
            color: colors.text,
            opacity: opacity.dimmed,
            fontSize: fontSizes.base,
          }}
          // eslint-disable-next-line react/jsx-no-literals
        >
          ~${transferDetail.usdAmount}
        </Text>
      )}
      <Text
        style={{
          color: colors.text,
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
            color: colors.text,
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          {t('traces', { ns: 'TransferDetails' })}
        </Text>
        <Entypo
          name={showTraces ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.gray}
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
              color: colors.text,
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            {type === 'outgoing'
              ? t('sentTo', { name: displayName })
              : t('receivedFrom', { name: displayName })}
          </Text>
          {transferDetail.transactions.map(tx => {
            return tx.traces.map((trace, i) => (
              <TraceListItem trace={trace} key={i} />
            ));
          })}
        </View>
      )}
    </ScrollView>
  );
};

export default TransferDetails;
