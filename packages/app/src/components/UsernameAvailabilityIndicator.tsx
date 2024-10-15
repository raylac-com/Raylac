import { theme } from '@/lib/theme';
import { MIN_USERNAME_LENGTH, USERNAME_REGEX } from '@raylac/shared';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

interface UsernameAvailabilityIndicator {
  username: string;
  isUsernameAvailable: boolean;
  isPending: boolean;
}

const UsernameAvailabilityIndicator = (
  props: UsernameAvailabilityIndicator
) => {
  const { t } = useTranslation('SignUp');
  const { username, isUsernameAvailable, isPending } = props;

  if (!username || isPending) {
    return null;
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return (
      <Text
        style={{
          color: theme.waning,
        }}
      >
        {t('usernameLengthWarning', { minChars: MIN_USERNAME_LENGTH })}
      </Text>
    );
  }

  if (USERNAME_REGEX.test(username) === false) {
    return (
      <Text
        style={{
          color: theme.waning,
        }}
      >
        {t('usernameInvalid')}
      </Text>
    );
  }

  if (isUsernameAvailable === false) {
    return (
      <Text
        style={{
          color: theme.waning,
        }}
      >
        {t('usernameTaken')}
      </Text>
    );
  }

  return null;
};

export default UsernameAvailabilityIndicator;
