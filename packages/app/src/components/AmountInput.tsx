import { theme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { TextInput } from 'react-native';

const containsNonNumberChars = (str: string): boolean => {
  return !/^(-?)([0-9]*)\.?([0-9]*)$/.test(str);
};

interface AmountInputProps {
  amount: string;
  onInputChange: (amount: string) => void;
  autoFocus: boolean;
}

const AmountInput = (props: AmountInputProps) => {
  const { amount, onInputChange } = props;

  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
      }}
    >
      <TextInput
        autoFocus={props.autoFocus}
        value={amount !== null ? amount.toString() : ''}
        onChangeText={_amount => {
          if (!containsNonNumberChars(_amount)) {
            onInputChange(_amount);
          }
        }}
        style={{
          flex: 1,
          fontSize: 28,
          textAlign: 'right',
          color: theme.text,
          borderWidth: 1,
          borderColor: theme.gray,
          borderRadius: 8,
          paddingHorizontal: 8,
          height: 52,
        }}
        keyboardType="decimal-pad"
      />
      <Text
        style={{
          color: theme.text,
          textAlign: 'center',
          opacity: 0.8,
          width: 62,
        }}
      >
        {t('usd', {
          ns: 'common',
        })}
      </Text>
    </View>
  );
};

export default AmountInput;
