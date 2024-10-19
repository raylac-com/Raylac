import LinkText from '@/components/LinkText';
import TransferDetailListItem from '@/components/TransferDetailListItem';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { getSwap, shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import {
  formatAmount,
  getBlockExplorerUrl,
  getTokenMetadata,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, Text, View } from 'react-native';
import { Hex } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'TransferDetails'>;

const SwapDetails = ({ route }: Props) => {
  const { txHash } = route.params;

  const { data: transferDetail } = trpc.getTransferDetails.useQuery({
    txHash,
  });

  const blockTimestamp = new Date(
    Number(transferDetail?.block?.timestamp) * 1000
  );

  if (!transferDetail) {
    return null;
  }

  const swap = getSwap(transferDetail);

  const inputTokenMeta = getTokenMetadata(swap.inputTokenId);
  const outputTokenMeta = getTokenMetadata(swap.outputTokenId);

  const inputAmount = swap.inputAmount;
  const outputAmount = swap.outputAmount;

  const inputAmountFormatted = formatAmount(
    inputAmount,
    inputTokenMeta.decimals
  );
  const outputAmountFormatted = formatAmount(
    outputAmount,
    outputTokenMeta.decimals
  );

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        rowGap: 40,
      }}
      style={{
        backgroundColor: theme.background,
        paddingTop: 60,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 10,
        }}
      >
        <Text
          style={{
            color: theme.green,
            fontSize: 32,
            fontWeight: 'bold',
          }}
        >
          Swap
        </Text>
        <AntDesign name="checkcircle" size={28} color={theme.green} />
      </View>
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          rowGap: 10,
        }}
      >
        <Text
          style={{
            color: theme.text,
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          {inputAmountFormatted} {inputTokenMeta.symbol}
        </Text>
        <MaterialIcons
          name="swap-horizontal-circle"
          size={30}
          color={theme.primary}
        />
        <Text
          style={{
            color: theme.text,
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          {outputAmountFormatted} {outputTokenMeta.symbol}
        </Text>
      </View>
      <Text
        style={{
          color: theme.text,
          opacity: 0.5,
        }}
      >
        {blockTimestamp.toLocaleString()}
      </Text>
      <TransferDetailListItem
        label="txHash"
        value={
          <LinkText
            text={shortenAddress(txHash as Hex)}
            url={`${getBlockExplorerUrl(transferDetail.traces[0].chainId)}/tx/${txHash}`}
          ></LinkText>
        }
      ></TransferDetailListItem>
    </ScrollView>
  );
};

export default SwapDetails;
