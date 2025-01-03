import Entypo from '@expo/vector-icons/Entypo';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import StyledText from '@/components/StyledText/StyledText';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { View } from 'react-native';
import colors from '@/lib/styles/colors';

const SettingsListItem = ({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}) => {
  return (
    <FeedbackPressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
    >
      {icon}
      <StyledText>{title}</StyledText>
    </FeedbackPressable>
  );
};

const Settings = () => {
  const navigation = useTypedNavigation();

  const onAddressesPress = () => {
    navigation.navigate('Addresses');
  };

  const onAdvancedPress = () => {
    navigation.navigate('Advanced');
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'column', gap: 28 }}>
        <SettingsListItem
          title="Addresses"
          icon={<Entypo name="wallet" size={24} color={colors.border} />}
          onPress={onAddressesPress}
        />
        <SettingsListItem
          title="Advanced"
          icon={<Entypo name="rocket" size={24} color={colors.border} />}
          onPress={onAdvancedPress}
        />
      </View>
    </View>
  );
};

export default Settings;
