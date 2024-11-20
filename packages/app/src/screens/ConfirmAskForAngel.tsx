import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { RootStackParamsList } from '@/navigation/types';
import StyledButton from '@/components/StyledButton';
import colors from '@/lib/styles/colors';
import { copyToClipboard } from '@/lib/utils';
import fontSizes from '@/lib/styles/fontSizes';
import MultiLineInput from '@/components/MultiLineInput';
import spacing from '@/lib/styles/spacing';
import Toast from 'react-native-toast-message';
import useTypedNavigation from '@/hooks/useTypedNavigation';
// import { useCallback } from 'react';
// import FontAwesome5 from '@expo/vector-icons/build/FontAwesome5';

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmAskForAngel'>;

const ConfirmAskForAngel = ({ route }: Props) => {
  const navigation = useTypedNavigation();
  const { t } = useTranslation('ConfirmAskForAngel');
  const { title, description, usdAmount, angelRequestId } = route.params;

  const link = `https://raylac.com/request/${angelRequestId}`;

  const onCopyPress = () => {
    copyToClipboard(link);
    Toast.show({
      type: 'success',
      text1: t('copied', { ns: 'common' }),
      position: 'top',
      visibilityTime: 1000,
    });
  };

  const onBackToHomePress = () => {
    navigation.navigate('Tabs', { screen: 'Home' });
  };

  // const onSharePress = useCallback(() => {}, []);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: spacing.base,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          rowGap: spacing.base,
        }}
      >
        <Text
          style={{
            fontSize: fontSizes.large,
            fontWeight: 'bold',
            color: colors.angelPink,
            textAlign: 'center',
            lineHeight: 32,
          }}
        >
          {`Share your request \n with angels`}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.large,
            fontWeight: 'bold',
          }}
        >
          {t('amountInUsd', {
            amount: usdAmount,
          })}
        </Text>
        <Text style={{ color: colors.text, fontSize: fontSizes.base }}>
          {title}
        </Text>
        <MultiLineInput
          placeholder={''}
          value={description}
          onChangeText={() => {}}
          editable={false}
        />
      </View>
      <View style={{ flexDirection: 'column', rowGap: 8, width: '100%' }}>
        <StyledButton
          disabled={!link}
          title={t('copyLink')}
          onPress={onCopyPress}
          variant="primary"
        />
        <StyledButton
          variant="outline"
          disabled={!link}
          title={t('backToHome')}
          onPress={onBackToHomePress}
        />
        {/**
           * 
        <StyledButton
          variant="outline"
          disabled={!link}
          title={t('shareOnSocial')}
          onPress={onSharePress}
        />
        */}
      </View>
    </View>
  );
};

export default ConfirmAskForAngel;
