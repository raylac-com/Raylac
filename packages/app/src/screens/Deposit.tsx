import { ActivityIndicator, Text, View, Image } from 'react-native';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import { Hex } from 'viem';
import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import { useTranslation } from 'react-i18next';
import useGetNewDepositAccount from '@/hooks/useGetNewDepositAccount';
import { Feather, Ionicons } from '@expo/vector-icons';

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

const Deposit = () => {
  const [depositAddress, setDepositAddress] = useState<Hex | null>(null);
  const { mutateAsync: getNewDepositAccount, isPending: isGeneratingAddress } =
    useGetNewDepositAccount();

  const navigation = useTypedNavigation();
  const { t } = useTranslation('Deposit');

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
          alignItems: 'center',
          flexDirection: 'column',
          rowGap: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
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
            <Ionicons
              name="add-circle-outline"
              size={32}
              color={colors.primary}
            />
            <Text
              style={{
                fontSize: 24,
                textAlign: 'center',
                fontWeight: 'bold',
                color: colors.text,
              }}
            >
              {t('depositOn')}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              textAlign: 'center',
              color: colors.text,
            }}
          >
            {t('depositToFreshAddress')}
          </Text>
        </View>

        <View
          style={{
            height: 16,
            flexDirection: 'column',
            rowGap: 16,
          }}
        >
          {depositAddress && (
            <AddressWithChainIcon
              address={depositAddress}
              onCopyClick={onCopyClick}
              isLoading={isGeneratingAddress}
            />
          )}
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
        {!depositAddress || isGeneratingAddress ? (
          <StyledButton
            title={t('getDepositAddress')}
            onPress={async () => {
              const account = await getNewDepositAccount('');
              setDepositAddress(account.address);
            }}
            style={{
              width: '100%',
            }}
            testID="get-deposit-address"
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
          title={t('pastDepositAddresses')}
          onPress={() => {
            navigation.navigate('Addresses');
          }}
          style={{
            width: '100%',
          }}
          variant="underline"
          testID="past-deposit-addresses"
        ></StyledButton>
      </View>
    </View>
  );
};

export default Deposit;
