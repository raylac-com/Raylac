import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useCreateAccount from '@/hooks/useCreateAccoun';
import useDeriveAddress from '@/hooks/useDeriveAddress';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import useUserAddresses from '@/hooks/useUserAddresses';
import { getUserAddresses } from '@/lib/key';
import colors from '@/lib/styles/colors';
import { shortenAddress } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hex } from 'viem';

const CreateAddress = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const navigation = useTypedNavigation();

  const [mnemonicGenesisAddress, setMnemonicGenesisAddress] =
    useState<Hex | null>(null);

  const { mutateAsync: deriveAddress, isPending: isDerivingAddress } =
    useDeriveAddress();

  const { mutateAsync: createAccount, isPending: isCreatingAccount } =
    useCreateAccount();

  const { data: userAddresses } = useUserAddresses();

  useEffect(() => {
    if (userAddresses) {
      const _mnemonicGenesisAddress = userAddresses.find(
        a => a.mnemonicGenesisAddress
      );

      if (_mnemonicGenesisAddress) {
        setMnemonicGenesisAddress(
          _mnemonicGenesisAddress.mnemonicGenesisAddress!
        );
      }
    }
  }, [userAddresses]);

  const onCreatePress = async () => {
    const addresses = await getUserAddresses();

    if (mnemonicGenesisAddress) {
      const mnemonicGenesisAddress = addresses.find(
        a => a.mnemonicGenesisAddress
      );

      if (!mnemonicGenesisAddress) {
        throw new Error('No mnemonic address found');
      }

      await deriveAddress(mnemonicGenesisAddress);
      navigation.navigate('Tabs', {
        screen: 'Addresses',
      });
    } else {
      const address = await createAccount();
      navigation.navigate('SaveBackupPhrase', {
        genesisAddress: address,
      });
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 16,
      }}
    >
      <View>
        <StyledText>
          {mnemonicGenesisAddress
            ? `Deriving from ${shortenAddress(mnemonicGenesisAddress)}`
            : 'New'}
        </StyledText>
      </View>
      <View>
        <StyledText>{`Name`}</StyledText>
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus={true}
          style={{
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 16,
            paddingHorizontal: 22,
            paddingVertical: 20,
          }}
        />
      </View>

      <StyledButton
        title="Create"
        onPress={onCreatePress}
        isLoading={isDerivingAddress || isCreatingAccount}
      />
    </View>
  );
};

export default CreateAddress;
