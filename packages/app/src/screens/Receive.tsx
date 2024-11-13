import { ActivityIndicator, Text, View, Image, Pressable } from 'react-native';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import { Hex } from 'viem';
import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import { useTranslation } from 'react-i18next';
import useGetNewDepositAccount from '@/hooks/useGetNewDepositAccount';
import { Feather } from '@expo/vector-icons';
import useSignedInUser from '@/hooks/useSignedInUser';

interface AddressWithChainIconProps {
  address: Hex;
  onCopyClick: () => void;
  isLoading: boolean;
}

const AddressWithChainIcon = (props: AddressWithChainIconProps) => {
  const { address, onCopyClick, isLoading } = props;
  return (
    <View
      style={{
        flexDirection: 'column',
        rowGap: 16,
      }}
    >
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
            color: colors.text,
          }}
          onPress={onCopyClick}
        >
          {isLoading ? (
            <ActivityIndicator></ActivityIndicator>
          ) : (
            shortenAddress(address)
          )}
        </Text>
        <Feather
          name="copy"
          size={16}
          color={colors.text}
          onPress={onCopyClick}
        />
      </View>
    </View>
  );
};

const Receive = () => {
  const [depositAddress, setDepositAddress] = useState<Hex | null>(null);
  const { mutateAsync: getNewDepositAccount, isPending: isGeneratingAddress } =
    useGetNewDepositAccount();

  const { data: signedInUser } = useSignedInUser();

  const navigation = useTypedNavigation();
  const { t } = useTranslation('Receive');

  const onCopyClick = useCallback(() => {
    if (depositAddress) {
      copyToClipboard(depositAddress);
      Toast.show({
        type: 'success',
        text1: t('copied', { ns: 'common' }),
        position: 'top',
        visibilityTime: 1000,
      });
    }
  }, [depositAddress]);

  const onUsernameCopyClick = useCallback(() => {
    copyToClipboard(signedInUser.username);
    Toast.show({
      type: 'success',
      text1: t('copied', { ns: 'common' }),
      position: 'top',
      visibilityTime: 1000,
    });
  }, [signedInUser]);

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
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 24,
            textAlign: 'center',
            fontWeight: 'bold',
            color: colors.text,
          }}
        >
          {t('receiveOn')}
        </Text>
      </View>
      <View
        style={{
          flex: 2,
          alignItems: 'center',
          flexDirection: 'column',
          rowGap: 16,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            textAlign: 'center',
            color: colors.text,
            fontWeight: 'bold',
          }}
        >
          {t('receiveFromRaylacUser')}
        </Text>

        <Text
          style={{
            fontSize: 16,
            textAlign: 'center',
            color: colors.text,
          }}
        >
          {t('yourRaylacUsername')}
        </Text>
        <Pressable
          style={{
            borderRadius: 16,
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: colors.text,
          }}
          onPress={onUsernameCopyClick}
        >
          <Text
            style={{
              fontSize: 16,
              textAlign: 'center',
              color: colors.gray,
            }}
            // eslint-disable-next-line react/jsx-no-literals
          >
            @{signedInUser?.username}
          </Text>
        </Pressable>
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
        <View
          style={{
            height: 24,
            flexDirection: 'column',
            rowGap: 16,
          }}
        >
          {depositAddress && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                columnGap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                {t('receiveTo')}
              </Text>
              <AddressWithChainIcon
                address={depositAddress}
                onCopyClick={onCopyClick}
                isLoading={isGeneratingAddress}
              />
            </View>
          )}
        </View>
        <Text
          style={{
            fontSize: 16,
            textAlign: 'center',
            color: colors.text,
            fontWeight: 'bold',
          }}
        >
          {t('orReceiveFromAnyone')}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {t('receiveToFreshAddress')}
        </Text>
        {!depositAddress || isGeneratingAddress ? (
          <StyledButton
            title={t('getReceivingAddress')}
            onPress={async () => {
              const account = await getNewDepositAccount('');
              setDepositAddress(account.address);
            }}
            style={{
              width: '100%',
            }}
            testID="get-receiving-address"
          ></StyledButton>
        ) : (
          <StyledButton
            title={t('copyAddress')}
            onPress={() => {
              onCopyClick();
            }}
            style={{
              width: '100%',
            }}
            testID="copy-address"
          ></StyledButton>
        )}
        <StyledButton
          title={t('pastReceivingAddresses')}
          onPress={() => {
            navigation.navigate('Addresses');
          }}
          style={{
            width: '100%',
          }}
          variant="underline"
          testID="past-receiving-addresses"
        ></StyledButton>
      </View>
    </View>
  );
};

export default Receive;
