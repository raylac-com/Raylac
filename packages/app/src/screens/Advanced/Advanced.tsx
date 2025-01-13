import StyledText from '@/components/StyledText/StyledText';
import { View } from 'react-native';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

const Advanced = () => {
  const EXPO_PUBLIC_RPC_URL = process.env.EXPO_PUBLIC_RPC_URL;

  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const { isAvailable } = await Updates.checkForUpdateAsync();
      setIsUpdateAvailable(isAvailable);
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <StyledText>{`RPC URL: ${EXPO_PUBLIC_RPC_URL}`}</StyledText>
      <StyledText>{`Update Channel: ${Updates.channel}`}</StyledText>
      <StyledText>{`Runtime Version: ${Updates.runtimeVersion}`}</StyledText>
      <StyledText>{`Update ID: ${Updates.updateId}`}</StyledText>
      <StyledText>
        {`Update Available: ${String(isUpdateAvailable)}`}
      </StyledText>
    </View>
  );
};

export default Advanced;
