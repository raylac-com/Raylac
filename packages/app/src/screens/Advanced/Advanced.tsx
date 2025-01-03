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
      <StyledText>{`RPC URL ${EXPO_PUBLIC_RPC_URL}`}</StyledText>
      <StyledText>{`Update channel: ${Updates.channel}`}</StyledText>
      <StyledText>{`Runtime version: ${Updates.runtimeVersion}`}</StyledText>
      <StyledText>{`Updated ID : ${Updates.updateId}`}</StyledText>
      <StyledText>{`Update available: ${isUpdateAvailable}`}</StyledText>
    </View>
  );
};

export default Advanced;
