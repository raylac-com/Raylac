import Feather from '@expo/vector-icons/Feather';
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

  const onAdvancedPress = () => {
    navigation.navigate('Advanced');
  };

  const onLanguagePress = () => {
    navigation.navigate('SelectLanguage');
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
          title="Advanced"
          icon={<Feather name="zap" size={24} color={colors.border} />}
          onPress={onAdvancedPress}
        />
        <SettingsListItem
          title="Language"
          icon={<Feather name="globe" size={24} color={colors.border} />}
          onPress={onLanguagePress}
        />
      </View>
    </View>
  );
};

export default Settings;
