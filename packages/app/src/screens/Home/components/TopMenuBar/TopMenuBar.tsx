import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import useUserAddresses from '@/hooks/useUserAddresses';
import Ionicons from '@expo/vector-icons/Ionicons';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import useTypedNavigation from '@/hooks/useTypedNavigation';
const TopMenuBar = () => {
  const { data: addresses } = useUserAddresses();

  const navigation = useTypedNavigation();

  return (
    <FeedbackPressable
      onPress={() => {
        navigation.navigate('Addresses');
      }}
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
    </FeedbackPressable>
  );
};

export default TopMenuBar;
