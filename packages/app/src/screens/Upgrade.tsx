import StyledButton from '@/components/StyledButton';
import useUpgradeAccounts from '@/hooks/useUpgradeAccounts';
import { theme } from '@/lib/theme';
import { EXPECTED_CONTRACT_IMPL } from '@/lib/upgrade';
import { View, Text } from 'react-native';

const Upgrade = () => {
  const {
    mutateAsync: upgradeAccounts,
    isPending: isUpgrading,
    isReady,
  } = useUpgradeAccounts();

  const handleUpgradePress = async () => {
    await upgradeAccounts(EXPECTED_CONTRACT_IMPL);
  };

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
      <StyledButton
        isLoading={isUpgrading}
        title="Update"
        onPress={handleUpgradePress}
        disabled={!isReady}
      />
    </View>
  );
};

export default Upgrade;
