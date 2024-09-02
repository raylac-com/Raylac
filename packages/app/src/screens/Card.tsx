import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

const CARD_WIDTH = 317;
const CARD_HEIGHT = 200;

const Card = () => {
  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 24,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: theme.secondary,
      }}
    >
      <Text
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          color: theme.text,
          fontSize: 24,
        }}
      >
        VISA
      </Text>
    </View>
  );
};

const CardScreen = () => {
  const navigation = useTypedNavigation();
  const { t } = useTranslation('Card');

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      <Card></Card>
      <StyledButton
        title={t('cardInfo')}
        onPress={() => navigation.navigate('CardInfo')}
        style={{
          marginTop: 24,
        }}
      ></StyledButton>
    </View>
  );
};

export default CardScreen;
