import { Text, View, Pressable } from 'react-native';
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
import SupportedChainsBanner from '@/components/SuppotedChainsBanner';
import fontSizes from '@/lib/styles/fontSizes';

interface ReceivingAddressProps {
  address: Hex;
  onCopyClick: () => void;
}

const ReceivingAddress = (props: ReceivingAddressProps) => {
  const { address, onCopyClick } = props;
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
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            color: colors.text,
          }}
          onPress={onCopyClick}
        >
          {shortenAddress(address)}
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
          alignItems: 'center',
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
              fontSize: fontSizes.base,
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
                  fontSize: fontSizes.base,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                {t('receiveTo')}
              </Text>
              <ReceivingAddress
                address={depositAddress}
                onCopyClick={onCopyClick}
              />
            </View>
          )}
        </View>
        <Text
          style={{
            fontSize: fontSizes.base,
            textAlign: 'center',
            color: colors.text,
            fontWeight: 'bold',
          }}
        >
          {t('orReceiveFromAnyone')}
        </Text>
        <SupportedChainsBanner size={20} />
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
            variant="primary"
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
            variant="outline"
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
          variant="outline"
          testID="past-receiving-addresses"
        ></StyledButton>
        <StyledButton
          title={t('supportedChainsAndTokens')}
          onPress={() => {
            navigation.navigate('SupportedChains');
          }}
          style={{ width: '100%' }}
          variant="underline"
        ></StyledButton>
      </View>
    </View>
  );
};

export default Receive;
