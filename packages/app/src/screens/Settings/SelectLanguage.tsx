import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveSelectedLanguage } from '@/i18n';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import StyledText from '@/components/StyledText/StyledText';

const SelectLanguage = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = async (lang: 'en' | 'ja') => {
    saveSelectedLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        padding: 16,
        gap: 16,
      }}
    >
      <FeedbackPressable
        onPress={() => handleLanguageChange('en')}
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor: 'white',
        }}
      >
        <StyledText>{t('SelectLanguage.english')}</StyledText>
      </FeedbackPressable>
      <FeedbackPressable
        onPress={() => handleLanguageChange('ja')}
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor: 'white',
        }}
      >
        <StyledText>{t('SelectLanguage.japanese')}</StyledText>
      </FeedbackPressable>
    </View>
  );
};

export default SelectLanguage;
