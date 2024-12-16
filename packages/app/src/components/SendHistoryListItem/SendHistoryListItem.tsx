import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import TokenLogo from '../FastImage/TokenLogo';
import StyledText from '../StyledText/StyledText';
import Feather from '@expo/vector-icons/Feather';
import { TransferHistoryItem } from '@raylac/shared';
import { shortenAddress } from '@/lib/utils';

const SendHistoryListItem = (props: { transfer: TransferHistoryItem }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderColor: colors.border,
        borderBottomWidth: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TokenLogo
          source={{
            uri: props.transfer.token.logoURI,
          }}
          style={{ marginRight: 8, width: 42, height: 42 }}
        />
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            rowGap: 4,
          }}
        >
          <StyledText style={{ fontWeight: 'bold' }}>
            {`$${props.transfer.amountUsd}`}
          </StyledText>
          <StyledText>{shortenAddress(props.transfer.to)}</StyledText>
        </View>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <StyledText style={{ color: colors.border }}>{`Sent`}</StyledText>
        <Feather name="send" size={24} color={colors.angelPink} />
      </View>
    </View>
  );
};

export default SendHistoryListItem;
