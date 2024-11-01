import StyledButton from '@/components/StyledButton';
import { theme } from '@/lib/theme';
import { View, Text } from 'react-native';

const Upgrade = () => {
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
          color: theme.text,
          textAlign: 'center',
        }}
      >
        Apply latest update to your account
      </Text>
      <StyledButton title="Update" onPress={handleUpgradePress} />
    </View>
  );
};

export default Upgrade;
