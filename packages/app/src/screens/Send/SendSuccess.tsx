import { Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import StyledButton from '@/components/StyledButton';
import { useTranslation } from 'react-i18next';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import spacing from '@/lib/styles/spacing';

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
      <Feather name="check-circle" size={64} color={colors.green} />
      <Text
        style={{
          color: colors.text,
          marginTop: 24,
          fontSize: 24,
        }}
      >
        {t('transferSuccessful')}
      </Text>
      <View style={{ width: '40%' }}>
        <StyledButton
          variant="primary"
          title={t('backToHome')}
          style={{
            marginTop: spacing.large,
          }}
          onPress={() => {
            navigate('Tabs', {
              screen: 'Home',
            });
          }}
          testID="back-to-home"
        ></StyledButton>
      </View>
    </View>
  );
};

export default SendSuccess;