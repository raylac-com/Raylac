import Blockie from '@/components/Blockie/Blockie';
import TokenLogo from '@/components/FastImage/TokenLogo';
import Separator from '@/components/Separator';
import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { getChainIcon, shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { getChainFromId } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = Pick<
  NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>,
  'route'
>;

const ConfirmSend = ({ route }: Props) => {
  const { address, amount, token, outputChainId } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingTop: 48,
        paddingHorizontal: 16,
        rowGap: 16,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={{ flexDirection: 'column', rowGap: 24 }}>
        <View
          style={{ flexDirection: 'column', alignItems: 'center', rowGap: 12 }}
        >
          <Blockie address={address} size={90} />
          <StyledText
            style={{
              fontSize: fontSizes.large,
            }}
          >
            {shortenAddress(address)}
          </StyledText>
        </View>
        {/* Send details */}
        <View
          style={{
            flexDirection: 'column',
            rowGap: 12,
            borderColor: colors.border,
            borderWidth: 1,
            padding: 16,
            borderRadius: 16,
          }}
        >
          {/* Amount */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
          >
            <TokenLogo
              source={{ uri: token.logoURI }}
              style={{ width: 24, height: 24 }}
            />
            <StyledText>{`${amount} ${token.symbol}`}</StyledText>
          </View>
          <Separator />
          {/* Chain */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
          >
            <StyledText>{`Recipient receives on `}</StyledText>
            <Image
              source={getChainIcon(outputChainId)}
              style={{ width: 24, height: 24 }}
            />
            <StyledText>{`${getChainFromId(outputChainId).name}`}</StyledText>
          </View>
        </View>
      </View>
      <StyledButton title="Send" onPress={() => {}} />
    </View>
  );
};

export default ConfirmSend;
