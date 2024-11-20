import colors from '@/lib/styles/colors';
import spacing from '@/lib/styles/spacing';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { TextInput } from 'react-native';

const containsNonNumberChars = (str: string): boolean => {
  return !/^(-?)([0-9]*)\.?([0-9]*)$/.test(str);
};

interface FiatAmountInputProps {
  amount: string;
  onInputChange: (amount: string) => void;
  autoFocus: boolean;
}

const FiatAmountInput = (props: FiatAmountInputProps) => {
  const { amount, onInputChange } = props;

  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: spacing.xSmall,
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
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.gray,
          borderRadius: 8,
          paddingHorizontal: 8,
          height: 52,
        }}
        keyboardType="decimal-pad"
      />
      <Text
        style={{
          color: colors.text,
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

export default FiatAmountInput;
