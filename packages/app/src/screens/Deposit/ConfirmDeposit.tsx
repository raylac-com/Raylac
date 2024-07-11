import { Text, View } from 'react-native';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamsList } from '@/navigation/types';
import { Hex } from 'viem';
import { Feather } from '@expo/vector-icons';
import { useCallback } from 'react';
import Toast from 'react-native-toast-message';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmDeposit'>;

const ConfirmDeposit = ({ route }: Props) => {
  const depositAddress = route.params.address as Hex;
  const amount = route.params.amount;

  const navigation = useTypedNavigation();
  const { t } = useTranslation('ConfirmDeposit');

  const onCopyClick = useCallback(() => {
    copyToClipboard(depositAddress);
    Toast.show({
      type: 'success',
      text1: 'Copied address',
      position: 'bottom',
    });
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
          fontWeight: 'bold',
          textAlign: 'center',
          color: theme.text,
        }}
      >
        Send {amount} USDC to the following address on Base
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 8,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            textAlign: 'center',
            color: theme.text,
          }}
          onPress={onCopyClick}
        >
          {shortenAddress(depositAddress)}
        </Text>
        <Feather
          name="copy"
          size={18}
          color={theme.primary}
          onPress={onCopyClick}
        />
      </View>
      <View></View>
      <StyledButton
        title={t('confirm')}
        onPress={() =>
          navigation.navigate('Tabs', {
            screen: 'Home',
          })
        }
      ></StyledButton>
    </View>
  );
};

export default ConfirmDeposit;
