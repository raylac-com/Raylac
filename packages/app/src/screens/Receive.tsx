import { ActivityIndicator, Text, View, Image } from 'react-native';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import { Hex } from 'viem';
import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import useGetNewDepositAccount from '@/hooks/useGetNewDepositAccount';
import useSignedInUser from '@/hooks/useSignedInUser';
import StyledButton from '@/components/StyledButton';

const Receive = () => {
  const [depositAddress, setDepositAddress] = useState<Hex | null>(null);
  const { data: signedInUser } = useSignedInUser();

  const { mutateAsync: getNewDepositAccount } = useGetNewDepositAccount();

  const navigation = useTypedNavigation();
  const { t } = useTranslation('Receive');

  useEffect(() => {
    (async () => {
      if (signedInUser) {
        const account = await getNewDepositAccount();
        setDepositAddress(account.address);
      }
    })();
  }, [setDepositAddress, signedInUser]);

  const onCopyClick = useCallback(() => {
    if (depositAddress) {
      copyToClipboard(depositAddress);
      Toast.show({
        type: 'success',
        text1: t('copied', { ns: 'common' }),
        position: 'bottom',
      });
    }
  }, [depositAddress]);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        rowGap: 24,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          textAlign: 'center',
          color: theme.text,
        }}
      >
        {t('sendAmountToAddress')}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 8,
        }}
      >
        <Image
          source={require('../../assets/base.png')}
          style={{ width: 20, height: 20 }}
        ></Image>
        <Text
          style={{
            fontSize: 18, 
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.text,
          }}
          onPress={onCopyClick}
        >
          {depositAddress ? (
            shortenAddress(depositAddress)
          ) : (
            <ActivityIndicator></ActivityIndicator>
          )}
        </Text>
        <Feather
          name="copy"
          size={20}
          color={theme.primary}
          onPress={onCopyClick}
        />
      </View>
      <StyledButton
        title={t('backToHome')}
        onPress={async () => {
          navigation.navigate('Tabs', {
            screen: 'Home',
          });
        }}
      ></StyledButton>
    </View>
  );
};

export default Receive;
