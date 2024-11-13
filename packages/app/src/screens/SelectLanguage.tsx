import colors from '@/lib/styles/colors';
import { Pressable, Text, View } from 'react-native';
import Entypo from '@expo/vector-icons/Entypo';
import { useTranslation } from 'react-i18next';
import { saveSelectedLanguage } from '@/i18n';

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
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      onPress={() => {
        i18n.changeLanguage(code);
        saveSelectedLanguage(code as 'en' | 'ja');
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontWeight: 'bold',
        }}
      >
        {language}
      </Text>
      {i18n.language === code && (
        <Entypo name="check" size={12} color={colors.primary} />
      )}
    </Pressable>
  );
};

const SelectLanguage = () => {
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
