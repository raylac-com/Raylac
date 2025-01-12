import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import { Hex } from 'viem';
import colors from '@/lib/styles/colors';
import { shortenAddress } from '@/lib/utils';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';

const SendToCard = ({
  toAddress,
  alignCenter,
}: {
  toAddress: Hex;
  alignCenter?: boolean;
}) => {
  const { t } = useTranslation('SendToCard');
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
        justifyContent: alignCenter ? 'center' : 'flex-start',
      }}
    >
      <Feather name="send" size={18} color={colors.border} />
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <StyledText style={{ color: colors.border }}>{t('sendTo')}</StyledText>
        <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
          {shortenAddress(toAddress)}
        </StyledText>
      </View>
    </View>
  );
};

export default SendToCard;
