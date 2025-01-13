import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import FeedbackPressable from '../../components/FeedbackPressable/FeedbackPressable';
import StyledText from '../../components/StyledText/StyledText';
import { saveSelectedCurrency, getSelectedCurrency } from '../../lib/currency';

const CurrencyListItem = ({
  isSelected,
  currencyLabel,
  onPress,
}: {
  isSelected: boolean;
  currencyLabel: string;
  onPress: () => void;
}) => {
  return (
    <FeedbackPressable onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 24,
            height: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isSelected && <Feather name="check" size={18} color="black" />}
        </View>
        <StyledText>{currencyLabel}</StyledText>
      </View>
    </FeedbackPressable>
  );
};

const SelectCurrency = () => {
  const { t } = useTranslation('SelectCurrency');
  const [selectedCurrency, setSelectedCurrency] = React.useState<
    'usd' | 'jpy' | null
  >(null);

  React.useEffect(() => {
    (async () => {
      const c = await getSelectedCurrency();
      setSelectedCurrency(c || 'usd');
    })();
  }, []);

  const handleCurrencyChange = async (currency: 'usd' | 'jpy') => {
    saveSelectedCurrency(currency);
    setSelectedCurrency(currency);
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        padding: 16,
        gap: 24,
      }}
    >
      <CurrencyListItem
        isSelected={selectedCurrency === 'usd'}
        currencyLabel={t('usd')}
        onPress={() => handleCurrencyChange('usd')}
      />
      <CurrencyListItem
        isSelected={selectedCurrency === 'jpy'}
        currencyLabel={t('jpy')}
        onPress={() => handleCurrencyChange('jpy')}
      />
    </View>
  );
};

export default SelectCurrency;
