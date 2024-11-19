import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';
import { RootStackParamsList } from '@/navigation/types';
import StyledButton from '@/components/StyledButton';
import colors from '@/lib/styles/colors';
import { copyToClipboard } from '@/lib/utils';
import { useCallback } from 'react';
import FontAwesome5 from '@expo/vector-icons/build/FontAwesome5';

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmAskForAngel'>;

const ConfirmAskForAngel = ({ route }: Props) => {
  const { t } = useTranslation('ConfirmAskForAngel');
  const { description, usdAmount, angelRequestId } = route.params;

  const link = `https://raylac.com/request/${angelRequestId}`;

  const onCopyPress = () => {
    copyToClipboard(link);
  };

  const onSharePress = useCallback(() => {}, []);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      <View
        style={{
          flex: 0.62,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          rowGap: 8,
        }}
      >
        <FontAwesome5 name="feather-alt" size={48} color={colors.angelPink} />
        <TextInput
          editable={false}
          value={description}
          style={{
            fontSize: 16,
            height: 240,
            color: colors.text,
            width: '100%',
            borderWidth: 1,
            borderColor: colors.gray,
            borderRadius: 8,
            padding: 16,
          }}
          multiline={true}
        />
        <Text
          style={{
            color: colors.text,
            fontSize: 20,
            opacity: 0.6,
          }}
        >
          {t('amountInUsd', {
            amount: usdAmount,
          })}
        </Text>
      </View>
      <View style={{ flexDirection: 'column', rowGap: 8, width: '100%' }}>
        <StyledButton
          disabled={!link}
          title={t('copyLink')}
          onPress={onCopyPress}
          variant="outline"
        />
        <StyledButton
          variant="outline"
          disabled={!link}
          title={t('shareOnSocial')}
          onPress={onSharePress}
        />
      </View>
    </View>
  );
};

export default ConfirmAskForAngel;
