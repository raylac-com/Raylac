import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import TokenLogo from '../TokenLogo/TokenLogo';
import StyledText from '../StyledText/StyledText';
import { shortenAddress } from '@/lib/utils';
import { GetHistoryReturnType } from '@raylac/shared';

const MoveFundsHistoryListItem = (props: {
  transfer: GetHistoryReturnType[number];
}) => {
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
            {`$${props.transfer.amount.usdValueFormatted}`}
          </StyledText>
          <StyledText>{shortenAddress(props.transfer.from)}</StyledText>
        </View>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <StyledText style={{ color: colors.border }}>{`Move Funds`}</StyledText>
        <Ionicons name="wallet" size={24} color={colors.border} />
      </View>
    </View>
  );
};

export default MoveFundsHistoryListItem;
