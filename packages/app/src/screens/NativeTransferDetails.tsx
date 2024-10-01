import FastAvatar from '@/components/FastAvatar';
import LinkText from '@/components/LinkText';
import TransferDetailListItem from '@/components/TransferDetailListItem';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { Entypo } from '@expo/vector-icons';
import {
  formatAmount,
  getBlockExplorerUrl,
  getChainFromId,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type Props = NativeStackScreenProps<
  RootStackParamsList,
  'NativeTransferDetails'
>;

const NativeTransferDetails = ({ route }: Props) => {
  const { txHash, traceAddress } = route.params;
  const [showDetails, setShowDetails] = useState(false);

  const { data: transferDetail } = trpc.getNativeTransferDetails.useQuery({
    txHash,
    traceAddress,
  });

  const { data: blockTimestamp } = trpc.getBlockTimestamp.useQuery(
    {
      chainId: transferDetail?.chainId,
      blockNumber: Number(transferDetail?.blockNumber),
    },
    {
      enabled: !!transferDetail,
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
        paddingTop: 60,
      }}
    >
      <FastAvatar address={transferDetail.from} size={80}></FastAvatar>
      <Text
        style={{
          color: theme.text,
          fontSize: 14,
        }}
      >
        Received from {shortenAddress(transferDetail.from)}
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
        {blockTimestamp
          ? new Date(Number(blockTimestamp) * 1000).toLocaleString()
          : ''}
      </Text>
      <Pressable
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          columnGap: 4,
          marginTop: 32,
        }}
        onPress={() => setShowDetails(!showDetails)}
      >
        <Text
          style={{
            color: theme.text,
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          Details
        </Text>
        <Entypo
          name={showDetails ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.gray}
        />
      </Pressable>
      {showDetails && (
        <View
          style={{
            alignItems: 'center',
            rowGap: 8,
          }}
        >
          <TransferDetailListItem
            label={'From'}
            value={
              <LinkText
                text={shortenAddress(transferDetail.from)}
                url={`${getBlockExplorerUrl(transferDetail.chainId)}/address/${transferDetail.from}`}
              ></LinkText>
            }
          />
          <TransferDetailListItem
            label={'To'}
            value={
              <LinkText
                text={shortenAddress(transferDetail.to)}
                url={`${getBlockExplorerUrl(transferDetail.chainId)}/address/${transferDetail.to}`}
              ></LinkText>
            }
          />
          <TransferDetailListItem
            label="Tx Hash"
            value={
              <LinkText
                text={shortenAddress(transferDetail.txHash)}
                url={`${getBlockExplorerUrl(transferDetail.chainId)}/tx/${txHash}`}
              ></LinkText>
            }
          />
          <TransferDetailListItem
            label="Chain"
            value={
              <Text
                style={{
                  color: theme.text,
                }}
              >
                {getChainFromId(transferDetail.chainId).name}
              </Text>
            }
          />
        </View>
      )}
    </ScrollView>
  );
};

export default NativeTransferDetails;
