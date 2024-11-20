import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';

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
  const navigation = useTypedNavigation();

  return (
    <ActionSheet
      containerStyle={{
        flexDirection: 'column',
        backgroundColor: colors.background,
        paddingHorizontal: spacing.large,
        paddingVertical: spacing.base,
      }}
    >
      <OtherMenuItem
        icon={
          <FontAwesome5 name="feather-alt" size={16} color={colors.angelPink} />
        }
        title="Find angels"
        onPress={() => {
          SheetManager.hide('home-other-menus');
          navigation.navigate('AskForAngel');
        }}
      />
    </ActionSheet>
  );
};

export default HomeOtherMenusActionSheet;
