import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import StyledText from '../../components/StyledText/StyledText';
import StyledButton from '../../components/StyledButton/StyledButton';
import colors from '../../lib/styles/colors';
import { UserAddress } from '../../types';
import { saveUserAddress, getUserAddresses } from '../../lib/key';
import { RootStackParamsList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamsList, 'EditAddressLabel'>;

const EditAddressLabel = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const { address } = route.params;
  const [label, setLabel] = useState('');
  const [userAddress, setUserAddress] = useState<UserAddress | null>(null);

  useEffect(() => {
    const loadAddress = async () => {
      const addresses = await getUserAddresses();
      const currentAddress = addresses.find(addr => addr.address === address);
      if (currentAddress) {
        setUserAddress(currentAddress);
        setLabel(currentAddress.label || '');
      }
    };
    loadAddress();
  }, [address]);

  const onSave = async () => {
    if (!userAddress) return;

    await saveUserAddress({
      ...userAddress,
      label: label.trim() || undefined, // Remove empty strings
    });
    navigation.goBack();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 32,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <View style={{ rowGap: 24 }}>
        <StyledText style={{ fontWeight: 'bold' }}>
          {'Edit Address Label'}
        </StyledText>
        <View style={{ rowGap: 8 }}>
          <StyledText style={{ color: colors.subbedText }}>
            {'Label'}
          </StyledText>
          <TextInput
            style={{
              backgroundColor: colors.card,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              fontSize: 16,
            }}
            value={label}
            onChangeText={setLabel}
            placeholder="Enter a label for this address"
            placeholderTextColor={colors.subbedText}
            autoFocus
          />
        </View>
      </View>
      <View
        style={{
          marginTop: 'auto',
          rowGap: 12,
        }}
      >
        <StyledButton title="Save" onPress={onSave} />
        <StyledButton
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
};

export default EditAddressLabel;
