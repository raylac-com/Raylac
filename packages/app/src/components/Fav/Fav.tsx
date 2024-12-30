import { Pressable, View } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import colors from '@/lib/styles/colors';
import { useState } from 'react';

const FavMenuItem = ({
  icon,
  label: _label,
  onPress: _onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) => {
  return (
    <Pressable
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
    </Pressable>
  );
};

const FavMenuItems = () => {
  return (
    <View
      style={{
        flexDirection: 'column',
        paddingVertical: 12,
      }}
    >
      <FavMenuItem
        icon={<AntDesign name="plus" size={24} color={colors.text} />}
        label="Add"
        onPress={() => {}}
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
      }}
    >
      {expanded && <FavMenuItems />}
      <Pressable
        style={{
          backgroundColor: colors.text,
          borderRadius: 100,
          padding: 12,
          width: 50,
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => {
          setExpanded(!expanded);
        }}
      >
        <AntDesign name="plus" size={24} color={colors.background} />
      </Pressable>
    </View>
  );
};

export default Fav;
