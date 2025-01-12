import Feather from '@expo/vector-icons/Feather';
import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import { useState } from 'react';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import useTypedNavigation from '@/hooks/useTypedNavigation';

const FavMenuItem = ({
  icon,
  label: _label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) => {
  return (
    <FeedbackPressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.background,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          borderColor: colors.border,
          borderWidth: 1,
          padding: 12,
          borderRadius: 100,
        }}
      >
        {icon}
      </View>
    </FeedbackPressable>
  );
};

const FavMenuItems = () => {
  const navigation = useTypedNavigation();

  return (
    <View
      style={{
        flexDirection: 'column',
        rowGap: 20,
      }}
    >
      <FavMenuItem
        icon={<Feather name="send" size={24} color={colors.text} />}
        label="Send"
        onPress={() => {
          navigation.navigate('SelectRecipient');
        }}
      />
    </View>
  );
};

const Fav = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        rowGap: 20,
      }}
    >
      {expanded && <FavMenuItems />}
      <FeedbackPressable
        style={{
          backgroundColor: colors.text,
          borderRadius: 100,
          padding: 12,
          width: 50,
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: colors.text,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        onPress={() => {
          setExpanded(!expanded);
        }}
      >
        <Feather name="plus" size={24} color={colors.background} />
      </FeedbackPressable>
    </View>
  );
};

export default Fav;
