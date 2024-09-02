import { theme } from '@/lib/theme';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

interface CardInfoItemProps {
  label: string;
  value: string;
}

const CardInfoItem = (props: CardInfoItemProps) => {
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomColor: theme.primary,
        borderBottomWidth: 1,
        paddingBottom: 8,
      }}
    >
      <View>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
          }}
        >
          {props.label}
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: theme.text,
            fontSize: 20,
          }}
        >
          {props.value}
        </Text>
      </View>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 8,
        }}
      >
        <Feather name="copy" size={18} color={theme.text} />
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
            marginLeft: 8,
          }}
        >
          コピー
        </Text>
      </View>
    </View>
  );
};

const CardInfo = () => {
  const { t } = useTranslation('CardInfo');

  return (
    <View
      style={{
        padding: 24,
      }}
    >
      <View
        style={{
          alignItems: 'flex-start',
          rowGap: 24,
        }}
      >
        <CardInfoItem label={t('cardHolder')} value="John Doe" />
        <CardInfoItem label={t('cardNumber')} value="1234 5678 9012 3456" />
        <CardInfoItem label={t('expirationDate')} value="12/24" />
        <CardInfoItem label={t('cvv')} value="123" />
      </View>
    </View>
  );
};

export default CardInfo;
