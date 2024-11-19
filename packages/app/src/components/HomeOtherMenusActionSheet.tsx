import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';

interface OtherMenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

const OtherMenuItem = ({ icon, title, onPress }: OtherMenuItemProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        columnGap: spacing.xSmall,
        alignItems: 'center',
        paddingVertical: spacing.small,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {icon}
      <Text
        style={{
          color: colors.text,
          fontSize: fontSizes.base,
          fontWeight: 'bold',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const HomeOtherMenusActionSheet = () => {
  return (
    <ActionSheet
      containerStyle={{
        flexDirection: 'column',
        backgroundColor: '#181818',
        paddingHorizontal: spacing.large,
        paddingVertical: spacing.base,
      }}
    >
      <OtherMenuItem
        icon={
          <FontAwesome5 name="feather-alt" size={16} color={colors.angelPink} />
        }
        title="Find angels"
        onPress={() => {}}
      />
    </ActionSheet>
  );
};

export default HomeOtherMenusActionSheet;
