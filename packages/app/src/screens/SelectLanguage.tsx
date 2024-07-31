import { theme } from '@/lib/theme';
import { changeLanguage } from 'i18next';
import { Pressable, Text, View } from 'react-native';
import Entypo from '@expo/vector-icons/Entypo';
import { useTranslation } from 'react-i18next';

const languages = [
  {
    label: 'English',
    code: 'en',
  },
  {
    label: '日本語',
    code: 'ja',
  },
];

interface LanguageItemProps {
  language: string;
  code: string;
}

const LanguageItem = (props: LanguageItemProps) => {
  const { language, code } = props;
  const { i18n } = useTranslation();

  return (
    <Pressable
      style={{
        padding: 24,
        borderBottomColor: 'gray',
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      onPress={() => changeLanguage(code)}
    >
      <Text
        style={{
          color: theme.text,
        }}
      >
        {language}
      </Text>
      {i18n.language === code && (
        <Entypo name="check" size={12} color={theme.blue} />
      )}
    </Pressable>
  );
};

const SelectLanguage = () => {
  changeLanguage;

  return (
    <View
      style={{
        backgroundColor: 'white',
      }}
    >
      {languages.map(language => (
        <LanguageItem
          language={language.label}
          code={language.code}
          key={language.code}
        />
      ))}
    </View>
  );
};

export default SelectLanguage;
