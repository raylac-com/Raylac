import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

const containsNonNumberChars = (str: string): boolean => {
  return !/^(-?)([0-9]*)\.?([0-9]*)$/.test(str);
};

const SelectAngelRequest = () => {
  const [selectedAngelRequestId, setSelectedAngelRequestId] =
    useState<number>();

  const navigation = useTypedNavigation();

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
      <TextInput
        style={{
          fontSize: 16,
          color: theme.text,
          width: '100%',
          borderWidth: 1,
          borderColor: theme.gray,
          borderRadius: 8,
          padding: 16,
        }}
        placeholder="Enter angel request ID"
        value={selectedAngelRequestId?.toString()}
        onChangeText={text => {
          if (containsNonNumberChars(text)) {
            return;
          }
          setSelectedAngelRequestId(Number(text));
        }}
        keyboardType="numeric"
      />
      <StyledButton
        title="Next"
        style={{ width: '100%' }}
        disabled={!selectedAngelRequestId}
        onPress={() => {
          navigation.navigate('AngelTransfer', {
            angelRequestId: selectedAngelRequestId,
          });
        }}
      />
    </View>
  );
};

export default SelectAngelRequest;
