import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectAmount'>;

const SelectAmount = ({ navigation, route }: Props) => {
  const address = route.params.address;
  const token = route.params.token;

  const [amount, setAmount] = useState<string>('');

  return (
    <View style={{ flex: 1, padding: 16, rowGap: 20 }}>
      <StyledText style={{ color: colors.border }}>
        {`Send to ${shortenAddress(address)}`}
      </StyledText>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <TextInput
          keyboardType="numeric"
          value={amount}
          autoFocus
          onChangeText={setAmount}
          placeholder={'0.00'}
          style={{
            fontSize: fontSizes.twoXLarge,
            flexShrink: 1,
            width: '100%',
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            height: 56,
            paddingHorizontal: 16,
          }}
          numberOfLines={1}
        />
        <StyledText
          style={{ fontSize: fontSizes.twoXLarge, color: colors.border }}
        >
          {token.symbol}
        </StyledText>
      </View>
      <StyledButton
        title="Next"
        onPress={() => {
          navigation.navigate('SelectChain', {
            address,
            amount,
            token,
          });
        }}
      />
    </View>
  );
};

export default SelectAmount;
