import Feather from '@expo/vector-icons/Feather';
import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import colors from '@/lib/styles/colors';

const PendingIndicator = () => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 4,
      }}
    >
      <StyledText style={{ color: colors.border }}>{`Pending`}</StyledText>
      <Feather name="clock" size={14} color={colors.border} />
    </View>
  );
};

export default PendingIndicator;
