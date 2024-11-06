import { Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import StyledButton from '@/components/StyledButton';
import { useTranslation } from 'react-i18next';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';

/**
 * Screen shown after a transfer succeeds
 */
const SendSuccess = () => {
  const { t } = useTranslation('SendSuccess');
  const { navigate } = useTypedNavigation();

  return (
    <View
      style={{
        flex: 0.9,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Feather name="check-circle" size={64} color={theme.green} />
      <Text
        style={{
          color: theme.text,
          marginTop: 24,
          fontSize: 24,
        }}
      >
        {t('transferSuccessful')}
      </Text>
      <StyledButton
        title={t('backToHome')}
        style={{
          marginTop: 24,
        }}
        onPress={() => {
          navigate('Tabs', {
            screen: 'Home',
          });
        }}
        testID="back-to-home"
      ></StyledButton>
    </View>
  );
};

export default SendSuccess;
