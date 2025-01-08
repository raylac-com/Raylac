import Feather from '@expo/vector-icons/Feather';
import StyledText from '@/components/StyledText/StyledText';
import { InputAccessoryView, View } from 'react-native';
import colors from '@/lib/styles/colors';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';

const InputAccessoryButton = ({
  onPress,
  label,
  icon,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
}) => {
  return (
    <FeedbackPressable
      style={{
        backgroundColor: colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 6,
        width: 90,
        columnGap: 4,
        shadowColor: colors.border,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.7,
        shadowRadius: 4,
      }}
      onPress={onPress}
    >
      {icon}
      <StyledText style={{ color: colors.border }}>{label}</StyledText>
    </FeedbackPressable>
  );
};

const SearchInputAccessory = ({
  onClear,
  onPaste,
  inputAccessoryViewID,
}: {
  onClear: () => void;
  onPaste: () => void;
  inputAccessoryViewID: string;
}) => {
  return (
    <InputAccessoryView nativeID={inputAccessoryViewID}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          columnGap: 32,
          marginBottom: 24,
        }}
      >
        <InputAccessoryButton
          onPress={onClear}
          label="Clear"
          icon={<Feather name="x" size={20} color={colors.border} />}
        />
        <InputAccessoryButton
          onPress={onPaste}
          label="Paste"
          icon={<Feather name="clipboard" size={20} color={colors.border} />}
        />
      </View>
    </InputAccessoryView>
  );
};

export default SearchInputAccessory;
