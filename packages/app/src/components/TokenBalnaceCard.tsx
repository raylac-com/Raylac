import { MultiChainTokenBalance } from '@raylac/shared';
import { Text, View } from 'react-native';

export const TokenBalanceCard = (tokenBalance: MultiChainTokenBalance) => {
  return (
    <View>
      <Text>{tokenBalance.name}</Text>
      <Text>{tokenBalance.balance}</Text>
      <Text>{tokenBalance.usdValue}</Text>
    </View>
  );
};
