import { Pressable, View } from 'react-native';
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { hapticOptions } from '@/lib/utils';
import colors from '@/lib/styles/colors';
import Toast from 'react-native-toast-message';

const MenuItem = ({
  icon,
  onPress,
}: {
  icon: React.ReactNode;
  onPress: () => void;
}) => {
  return <Pressable onPress={onPress}>{icon}</Pressable>;
};

const ExpandButton = ({
  onOpen,
  onClose,
}: {
  onOpen: () => void;
  onClose: () => void;
}) => {
  return (
    <Pressable
      onPress={onOpen}
      onTouchStart={() => {
        onOpen();
      }}
      onPressIn={() => {
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
      }}
      onBlur={onClose}
    >
      <Ionicons name="chevron-expand-sharp" size={24} />
    </Pressable>
  );
};

const ExpandedMenuItems = ({ isOpen }: { isOpen: boolean }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 48,
      }}
    >
      <Pressable
        onTouchEndCapture={() => {
          ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
          Toast.show({
            type: 'success',
            text1: 'Home',
            text2: 'You pressed the home button',
          });
        }}
      >
        <AntDesign name="home" size={24} />
      </Pressable>
      <Pressable>
        <FontAwesome name="list-ul" size={24} />
      </Pressable>
    </View>
  );
};

const DefaultMenuItems = ({
  setExpanded,
}: {
  setExpanded: (expanded: boolean) => void;
}) => {
  return (
    <Pressable
      onPress={() => {
        setExpanded(false);
      }}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <MenuItem icon={<AntDesign name="home" size={24} />} onPress={() => {}} />
      <MenuItem
        icon={<FontAwesome name="list-ul" size={24} />}
        onPress={() => {}}
      />
      <MenuItem icon={<AntDesign name="swap" size={24} />} onPress={() => {}} />
      <ExpandButton
        onOpen={() => {
          setExpanded(true);
        }}
        onClose={() => {
          setExpanded(false);
        }}
      />
    </Pressable>
  );
};

const BottomNav = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={{
        flexDirection: 'column',
        paddingHorizontal: 64,
        justifyContent: 'flex-end',
        rowGap: 10,
        borderRadius: 32,
        borderWidth: 1,
        paddingVertical: 12,
        borderColor: colors.border,
      }}
    >
      <ExpandedMenuItems isOpen={expanded} />
      <DefaultMenuItems setExpanded={setExpanded} />
    </View>
  );
};

export default BottomNav;
