import { View } from 'react-native';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useTranslation } from 'react-i18next';

const SelectSend = () => {
  const navigation = useTypedNavigation();
  const { t } = useTranslation('SelectSend');

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        rowGap: 24,
      }}
    >
      <StyledButton
        title={t('sendToSutoriUser')}
        onPress={() => navigation.navigate('SendToSutoriUser')}
      ></StyledButton>
      <StyledButton
        title={t('sendToNonSutoriUser')}
        onPress={() => navigation.navigate('SendToNonSutoriUser')}
      ></StyledButton>
    </View>
  );
};

export default SelectSend;
