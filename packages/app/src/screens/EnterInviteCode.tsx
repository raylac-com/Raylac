import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import useDebounce from '@/hooks/useDebounce';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';

const ValidInviteCodeIndicator = ({ hidden }: { hidden: boolean }) => {
  return (
    <View
      style={{
        width: 20,
      }}
    >
      <Entypo
        style={{
          display: hidden ? 'none' : 'flex',
        }}
        name="check"
        size={18}
        color={theme.green}
      />
    </View>
  );
};

const InvalidInviteCodeLabel = ({ hidden }: { hidden: boolean }) => {
  const { t } = useTranslation('EnterInviteCode');

  return (
    <View
      style={{
        marginTop: 12,
        height: 18,
      }}
    >
      <Text
        style={{
          display: hidden ? 'none' : 'flex',
          color: theme.waning,
        }}
      >
        <Feather name="x" size={18} color={theme.waning} />
        {t('invalidInviteCode')}
      </Text>
    </View>
  );
};

const EnterInviteCode = () => {
  const navigation = useTypedNavigation();
  const [inviteCode, setInviteCode] = useState('');
  const { t } = useTranslation('EnterInviteCode');

  const {
    debouncedValue: debouncedInviteCode,
    isPending: isCheckingInviteCode,
  } = useDebounce(inviteCode, 500);

  const { data: isInviteCodeValid } = trpc.isInviteCodeValid.useQuery({
    inviteCode: debouncedInviteCode,
  });

  const onNextPress = useCallback(() => {
    navigation.navigate('SignUp', {
      inviteCode,
    });
  }, [inviteCode]);

  const showInvalidInviteCodeLabel =
    inviteCode !== '' &&
    isInviteCodeValid === false &&
    isCheckingInviteCode === false;

  const showValidInviteCodeLabel =
    inviteCode !== '' &&
    isInviteCodeValid === true &&
    isCheckingInviteCode === false;

  return (
    <View
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 48,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
          marginLeft: 20,
        }}
      >
        <StyledTextInput
          autoFocus
          placeholder={t('inviteCode')}
          value={inviteCode}
          onChangeText={setInviteCode}
        ></StyledTextInput>
        <ValidInviteCodeIndicator hidden={!showValidInviteCodeLabel} />
      </View>
      <InvalidInviteCodeLabel
        hidden={!showInvalidInviteCodeLabel}
      ></InvalidInviteCodeLabel>
      <StyledButton
        disabled={isInviteCodeValid !== true}
        title={t('next', { ns: 'common' })}
        style={{
          marginTop: 24,
        }}
        onPress={onNextPress}
      ></StyledButton>
    </View>
  );
};

export default EnterInviteCode;
