import { ActivityIndicator, Image, Text, View } from 'react-native';
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
import fontSizes from '@/lib/styles/fontSizes';
import { base } from 'viem/chains';
import { getChainLogo } from '@/lib/logo';
import spacing from '@/lib/styles/spacing';

interface DepositAddressProps {
  address: Hex;
  onCopyClick: () => void;
  isLoading: boolean;
}

const DepositAddress = (props: DepositAddressProps) => {
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
        <Text
          style={{
            fontSize: fontSizes.base,
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
  const [depositAddress, setDepositAddress] = useState<Hex | null>();
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
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          rowGap: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: spacing.xSmall,
          }}
        >
          <Text
            style={{
              fontSize: fontSizes.large,
              fontWeight: 'bold',
              textAlign: 'center',
              color: colors.text,
            }}
          >
            {t('depositUSDCOnBase')}
          </Text>
          <Image
            source={getChainLogo(base.id)}
            style={{ width: 32, height: 32 }}
          />
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
          flex: 1,
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          rowGap: 16,
        }}
      >
        {depositAddress && (
          <DepositAddress
            address={depositAddress}
            onCopyClick={onCopyClick}
            isLoading={isGeneratingAddress}
          />
        )}
        {!depositAddress || isGeneratingAddress ? (
          <StyledButton
            variant="primary"
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
          title={t('pastDepositAddresses')}
          onPress={() => {
            navigation.navigate('Addresses');
          }}
          style={{
            width: '100%',
          }}
          variant="outline"
          testID="past-deposit-addresses"
        ></StyledButton>
        {/**
           
        <StyledButton
          title={t('supportedChainsAndTokens')}
          onPress={() => {
            navigation.navigate('SupportedChains');
          }}
          style={{
            width: '100%',
          }}
          variant="underline"
        ></StyledButton>
        * 
           */}
      </View>
    </View>
  );
};

export default Deposit;
