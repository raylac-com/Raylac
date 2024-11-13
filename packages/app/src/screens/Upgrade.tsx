import StyledButton from '@/components/StyledButton';
import colors from '@/lib/styles/colors';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';

const Upgrade = () => {
  const { t } = useTranslation('Upgrade');

  const handleUpgradePress = async () => {};

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        rowGap: 16,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: colors.text,
          textAlign: 'center',
        }}
      >
        {t('upgradeAccount', { ns: 'Upgrade' })}
      </Text>
      <StyledButton title="Update" onPress={handleUpgradePress} />
    </View>
  );
};

export default Upgrade;
