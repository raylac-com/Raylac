import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en.json';
import ja from './translations/ja.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_LANGUAGE_KEY = 'selectedLanguage';

/**
 * Save the selected language to AsyncStorage
 */
export const saveSelectedLanguage = (language: 'en' | 'ja') => {
  AsyncStorage.setItem(SELECTED_LANGUAGE_KEY, language);
};

/**
 * Get the selected language from AsyncStorage
 */
export const getSelectedLanguage = async () => {
  const selectedLanguage = await AsyncStorage.getItem(SELECTED_LANGUAGE_KEY);
  return selectedLanguage as 'en' | 'ja';
};

i18n
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en,
      ja,
    },
    fallbackLng: 'en',
    debug: true,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
