import Feather from '@expo/vector-icons/Feather';
import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import { Hex } from 'viem';
import WalletIconAddress from '../WalletIconAddress/WalletIconAddress';
import colors from '@/lib/styles/colors';

const SendToCard = ({ toAddress }: { toAddress: Hex }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
      <Feather name="send" size={20} color={'#FF4959'} />
      <StyledText style={{ color: colors.border }}>{`Send to`}</StyledText>
      <WalletIconAddress address={toAddress} />
    </View>
  );
};

export default SendToCard;
