import { Text, View } from 'react-native';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DepositStackParamsList } from '@/navigation/types';
import { Hex } from 'viem';
import { Feather } from '@expo/vector-icons';
import { useCallback } from 'react';
import Toast from 'react-native-toast-message';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';

type Props = NativeStackScreenProps<DepositStackParamsList, 'ConfirmDeposit'>;

const ConfirmDeposit = ({ route }: Props) => {
  const depositAddress = route.params.address as Hex;
  const amount = route.params.amount;

  const navigation = useTypedNavigation();

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
        justifyContent: "center",
        padding: 24,
        rowGap: 24,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
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
          }}
          onPress={onCopyClick}
        >
          {shortenAddress(depositAddress)}
        </Text>
        <Feather name="copy" size={18} color="black" onPress={onCopyClick} />
      </View>
      <View></View>
      <StyledButton
        title="Back to Home"
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
