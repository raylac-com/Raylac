import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import fontSizes from '@/lib/styles/fontSizes';
import { getChainIcon, shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>;

const ConfirmSend = ({ route }: Props) => {
  const { address, amount, token, outputChainId } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 16,
        rowGap: 16,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          rowGap: 8,
        }}
      >
        <StyledText style={{ fontSize: fontSizes.twoXLarge }}>
          {`Send ${amount} ${token.symbol}`}
        </StyledText>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
        >
          <StyledText>{`${shortenAddress(address)} receives on`}</StyledText>
          <Image
            source={getChainIcon(outputChainId)}
            style={{ width: 24, height: 24 }}
          />
        </View>
      </View>
      <StyledButton title="Send" onPress={() => {}} />
    </View>
  );
};

export default ConfirmSend;
