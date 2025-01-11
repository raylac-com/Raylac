import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveSelectedLanguage } from '@/i18n';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import StyledText from '@/components/StyledText/StyledText';

const LanguageListItem = ({
  isSelected,
  language,
  onPress,
}: {
  isSelected: boolean;
  language: string;
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
        <StyledText>{language}</StyledText>
      </View>
    </FeedbackPressable>
  );
};

const SelectLanguage = () => {
  const { i18n } = useTranslation();

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
      <LanguageListItem
        isSelected={i18n.language === 'en'}
        language="English"
        onPress={() => handleLanguageChange('en')}
      />
      <LanguageListItem
        isSelected={i18n.language === 'ja'}
        language="日本語"
        onPress={() => handleLanguageChange('ja')}
      />
    </View>
  );
};

export default SelectLanguage;
