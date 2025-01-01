import StyledText from '@/components/StyledText/StyledText';
import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import useUserAddresses from '@/hooks/useUserAddresses';
import Ionicons from '@expo/vector-icons/Ionicons';
const TopMenuBar = () => {
  const { data: addresses } = useUserAddresses();

  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        columnGap: 4,
      }}
    >
      <Ionicons name="wallet-outline" size={24} color={colors.border} />
      <StyledText style={{ color: colors.border }}>
        {`${addresses?.length} addresses`}
      </StyledText>
    </View>
  );
};

export default TopMenuBar;
