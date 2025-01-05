import AntDesign from '@expo/vector-icons/AntDesign';
import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import TokenLogo from '../TokenLogo/TokenLogo';
import StyledText from '../StyledText/StyledText';
import { shortenAddress } from '@/lib/utils';
import { GetHistoryReturnType } from '@raylac/shared';

const ReceiveHistoryListItem = (props: {
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
            {`$${props.transfer.amount.formatted}`}
          </StyledText>
          <StyledText>{shortenAddress(props.transfer.from)}</StyledText>
        </View>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <StyledText style={{ color: colors.border }}>{`Received`}</StyledText>
        <AntDesign name="arrowdown" size={24} color="black" />
      </View>
    </View>
  );
};

export default ReceiveHistoryListItem;
