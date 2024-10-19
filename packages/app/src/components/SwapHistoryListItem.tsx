import { getSwap } from '@/lib/utils';
import { Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { formatAmount, getTokenMetadata } from '@raylac/shared';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { formatDistanceToNowStrict } from 'date-fns';
import { TransferItem } from '@/types';
// import useEnsName from '@/hooks/useEnsName';

interface SwapHistoryListItemProps {
  transfer: TransferItem;
}

const formatDate = (date: Date) => {
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

const SwapHistoryListItem = (props: SwapHistoryListItemProps) => {
  const { transfer } = props;

  const swap = getSwap(transfer);

  const inputTokenMeta = getTokenMetadata(swap.inputTokenId);
  const outputTokenMeta = getTokenMetadata(swap.outputTokenId);

  const formattedInputAmount = formatAmount(
    swap.inputAmount,
    inputTokenMeta.decimals
  );
  const formattedOutputAmount = formatAmount(
    swap.outputAmount,
    outputTokenMeta.decimals
  );

  const navigation = useTypedNavigation();

  const blockTimestamp = new Date(Number(transfer.block.timestamp) * 1000);

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
        navigation.navigate('SwapDetails', {
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
          <MaterialIcons
            name="swap-horizontal-circle"
            size={36}
            color={theme.primary}
          />
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              color: theme.primary,
            }}
          >
            Swap
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 4,
          }}
        >
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              color: theme.waning,
            }}
          >
            -{formattedInputAmount} {inputTokenMeta.symbol}
          </Text>
          <MaterialIcons name="swap-horiz" size={20} color={theme.primary} />
          {/**
          <AntDesign name="arrowright" size={18} color={theme.green} />
             * 
             */}
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              color: theme.green,
            }}
          >
            +{formattedOutputAmount} {outputTokenMeta.symbol}
          </Text>
        </View>
      </View>
      <Text
        style={{
          color: theme.text,
          textAlign: 'right',
          opacity: 0.5,
        }}
      >
        {blockTimestamp ? formatDate(blockTimestamp) : ''}
      </Text>
    </Pressable>
  );
};

export default SwapHistoryListItem;
