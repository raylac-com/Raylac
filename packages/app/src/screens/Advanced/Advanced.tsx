import StyledText from '@/components/StyledText/StyledText';
import { View } from 'react-native';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Advanced = () => {
  const { t } = useTranslation('Advanced_Advanced');
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
      <StyledText>
        {t('Advanced.rpcUrl', { url: EXPO_PUBLIC_RPC_URL })}
      </StyledText>
      <StyledText>
        {t('Advanced.updateChannel', { channel: Updates.channel })}
      </StyledText>
      <StyledText>
        {t('Advanced.runtimeVersion', { version: Updates.runtimeVersion })}
      </StyledText>
      <StyledText>
        {t('Advanced.updateId', { id: Updates.updateId })}
      </StyledText>
      <StyledText>
        {t('Advanced.updateAvailable', {
          available: String(isUpdateAvailable),
        })}
      </StyledText>
    </View>
  );
};

export default Advanced;
