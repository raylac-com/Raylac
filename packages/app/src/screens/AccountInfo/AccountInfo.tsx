import StyledButton from '@/components/StyledButton';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

interface AccountInfoListItemProps {
  label: string;
  value: string;
  onPress: () => void;
}

const AccountInfoListItem = (props: AccountInfoListItemProps) => {
  const { t } = useTranslation('AccountInfo');

  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomColor: colors.primary,
        borderBottomWidth: 1,
        paddingBottom: 8,
      }}
    >
      <View>
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
          }}
        >
          {props.label}
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: colors.text,
            fontSize: 20,
          }}
        >
          {props.value}
        </Text>
      </View>
      <View style={{ width: '20%', justifyContent: 'center' }}>
        <StyledButton
          title={t('edit')}
          onPress={props.onPress}
          variant="underline"
        ></StyledButton>
      </View>
    </View>
  );
};

const AccountInfo = () => {
  const { t } = useTranslation('AccountInfo');
  const { data: signedInUser } = useSignedInUser();

  const navigation = useTypedNavigation();

  return (
    <View
      style={{
        alignItems: 'center',
        rowGap: 24,
        padding: 24,
      }}
    >
      <AccountInfoListItem
        label={t('displayName')}
        value={signedInUser.name}
        onPress={() => {
          navigation.navigate('UpdateDisplayName');
        }}
      ></AccountInfoListItem>
      <AccountInfoListItem
        label={t('username')}
        value={signedInUser.username}
        onPress={() => {
          navigation.navigate('UpdateUsername');
        }}
      ></AccountInfoListItem>
    </View>
  );
};

export default AccountInfo;
