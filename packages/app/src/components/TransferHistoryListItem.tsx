import { shortenAddress } from '@/lib/utils';
import { Text, View } from 'react-native';
import FastAvatar from './FastAvatar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { Hex } from 'viem';
import { TransferHistoryQueryResult, formatAmount } from '@raylac/shared';
import { useTranslation } from 'react-i18next';
import supportedTokens from '@raylac/shared/out/supportedTokens';

/**
 *  Get the token metadata for a given token ID
 */
const getTokenMetadata = (tokenId: string) => {
  return supportedTokens.find(token => token.tokenId === tokenId);
};

interface IncomingTransferListItemProps {
  tx: TransferHistoryQueryResult;
}

const IncomingTransferListItem = (props: IncomingTransferListItemProps) => {
  const { tx } = props;
  const { t } = useTranslation();

  const isFromAddress = typeof tx.from === 'string';

  const blockTimestamp = new Date();

  const tokenMeta = getTokenMetadata(tx.tokenId);

  // const amount = tx.amount;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
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
          {isFromAddress && (
            <FastAvatar address={tx.from as Hex} size={36}></FastAvatar>
          )}
          <Text
            style={{
              color: theme.text,
            }}
          >
            {isFromAddress && shortenAddress(tx.from as Hex)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 4,
          }}
        >
          <Ionicons name="arrow-down-outline" size={18} color={theme.green} />
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              color: theme.green,
            }}
          >
            {formatAmount(tx.amount, tokenMeta.decimals)} {tokenMeta.symbol}
          </Text>
        </View>
      </View>
      <Text
        style={{
          color: theme.text,
          marginTop: 4,
          textAlign: 'right',
          opacity: 0.5,
        }}
      >
        {blockTimestamp.toLocaleDateString()}
      </Text>
    </View>
  );
};

interface OutGoingTransferListItemProps {
  tx: TransferHistoryQueryResult;
}

const OutGoingTransferListItem = (props: OutGoingTransferListItemProps) => {
  const { tx } = props;

  const blockTimestamp = new Date();

  const tokenMeta = getTokenMetadata(tx.tokenId);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
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
          <FastAvatar address={tx.to} size={36}></FastAvatar>
          <Text
            style={{
              color: theme.text,
            }}
          >
            {shortenAddress(tx.to as Hex)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 4,
          }}
        >
          <Ionicons name="arrow-up-outline" size={18} color={theme.waning} />
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              color: theme.waning,
            }}
          >
            {formatAmount(tx.amount, tokenMeta.decimals)} {tokenMeta.symbol}
          </Text>
        </View>
      </View>
      <Text
        style={{
          color: theme.text,
          marginTop: 4,
          textAlign: 'right',
          opacity: 0.5,
        }}
      >
        {blockTimestamp.toLocaleDateString()}
      </Text>
    </View>
  );
};

interface TransferHistoryListItemProps {
  tx: TransferHistoryQueryResult;
  type: 'incoming' | 'outgoing';
}

const TransferHistoryListItem = (props: TransferHistoryListItemProps) => {
  const { tx, type } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        padding: 12,
      }}
    >
      {type === 'incoming' ? (
        <IncomingTransferListItem tx={tx} />
      ) : (
        <OutGoingTransferListItem tx={tx} />
      )}
    </View>
  );
};

export default TransferHistoryListItem;
