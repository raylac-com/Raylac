import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENCY_KEY = 'currency';

/**
 * Save the selected currency to AsyncStorage
 */
export const saveSelectedCurrency = (currency: 'usd' | 'jpy') => {
  AsyncStorage.setItem(CURRENCY_KEY, currency);
};

/**
 * Get the selected currency from AsyncStorage
 */
export const getSelectedCurrency = async () => {
  const currency = await AsyncStorage.getItem(CURRENCY_KEY);
  return currency as 'usd' | 'jpy';
};

export const getCurrencySymbol = (currency: 'usd' | 'jpy') => {
  return currency === 'usd' ? '$' : '¥';
};

export const getCurrencyName = (currency: 'usd' | 'jpy') => {
  return currency === 'usd' ? 'US Dollar' : 'Japanese Yen';
};

export const getCurrencyCode = (currency: 'usd' | 'jpy') => {
  return currency === 'usd' ? 'USD' : 'JPY';
};
