import { ActivityIndicator, Text, View, Image, TextInput } from 'react-native';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import { Hex } from 'viem';
import { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import useGetNewDepositAccount from '@/hooks/useGetNewDepositAccount';
import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';

const Receive = () => {
  const [depositAddress, setDepositAddress] = useState<Hex | null>(null);
  const [label, setLabel] = useState<string>('');

  const queryClient = useQueryClient();
  const { mutateAsync: getNewDepositAccount } = useGetNewDepositAccount();
  const { mutateAsync: updateAddressLabel } =
    trpc.updateAddressLabel.useMutation({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getQueryKey(trpc.getStealthAccounts),
        });
      },
    });

  const { data: stealthAccounts } = trpc.getStealthAccounts.useQuery();

  useEffect(() => {
    (async () => {
      if (stealthAccounts && depositAddress === null) {
        const defaultLabel = `Address ${stealthAccounts.length + 1}`;
        if (stealthAccounts.length > 0) {
          setDepositAddress(stealthAccounts[0].address as Hex);
          setLabel(stealthAccounts[0].label || defaultLabel);
        } else {
          const account = await getNewDepositAccount(defaultLabel);
          setDepositAddress(account.address);
          setLabel(defaultLabel);
        }
      }
    })();
  }, [stealthAccounts]);

  const onCreateNewAddressPress = useCallback(async () => {
    const defaultLabel = `Address ${stealthAccounts.length + 2}`;
    const account = await getNewDepositAccount(defaultLabel);
    setDepositAddress(account.address);
    setLabel(defaultLabel);
  }, [setDepositAddress, setLabel, stealthAccounts]);

  const navigation = useTypedNavigation();
  const { t } = useTranslation('Deposit');

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
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      <View
        style={{
          flex: 2,
          justifyContent: 'center',
          flexDirection: 'column',
          rowGap: 16,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            textAlign: 'center',
            fontWeight: 'bold',
            color: theme.text,
          }}
        >
          {t('sendAmountToAddress')}
        </Text>
        <View
          style={{
            flexDirection: 'column',
            rowGap: 16,
          }}
        >
          <TextInput
            autoCapitalize="none"
            autoFocus
            style={{
              color: theme.gray,
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
            placeholder="Label"
            value={label}
            onChangeText={setLabel}
            onEndEditing={() => {
              updateAddressLabel({
                address: depositAddress as Hex,
                label,
              });
            }}
          ></TextInput>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: 8,
            }}
          >
            <Image
              // eslint-disable-next-line @typescript-eslint/no-require-imports
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
          </View>
          <StyledButton
            variant="underline"
            title={'Create new address'}
            onPress={onCreateNewAddressPress}
          ></StyledButton>
        </View>
      </View>
      <View
        style={{
          flex: 1,
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          rowGap: 16,
        }}
      >
        <StyledButton
          title={'Copy address'}
          onPress={() => {
            onCopyClick();
          }}
          style={{
            width: '100%',
          }}
          variant="outline"
        ></StyledButton>
        <StyledButton
          title={'Back'}
          onPress={() => {
            navigation.navigate('Tabs', {
              screen: 'Home',
            });
          }}
          style={{
            width: '100%',
          }}
        ></StyledButton>
      </View>
    </View>
  );
};

export default Receive;
