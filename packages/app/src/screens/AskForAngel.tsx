import { View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import colors from '@/lib/styles/colors';
import { useCallback, useState } from 'react';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { trpc } from '@/lib/trpc';
import FiatAmountInput from '@/components/FiatAmountInput';

const ASK_AMOUNT_LIMIT_USD = 1000;

const AskForAngel = () => {
  const { t } = useTranslation('AskForAngel');
  const [usdAmount, setUsdAmount] = useState<string>('');

  const [description, setDescription] = useState<string>('');

  const { mutateAsync: createAngelRequest, isPending: isCreatingAngelRequest } =
    trpc.createAngelRequest.useMutation();

  const navigation = useTypedNavigation();

  const isAmountWithinLimit =
    !usdAmount || parseFloat(usdAmount) <= ASK_AMOUNT_LIMIT_USD;

  const onNextPress = useCallback(async () => {
    const angelRequest = await createAngelRequest({
      description,
      usdAmount,
    });

    if (angelRequest) {
      navigation.navigate('ConfirmAskForAngel', {
        description,
        usdAmount,
        angelRequestId: angelRequest.id!,
      });
    }
  }, [description, usdAmount]);

  const canCreateRequest = description && usdAmount;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
        width: '100%',
        rowGap: 16,
        paddingTop: 16,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
        {t('writeARequest')}
      </Text>
      <Text style={{ color: colors.text, fontSize: 16 }}>
        {t('angelDescription')}
      </Text>
      <TextInput
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
        placeholderTextColor={colors.gray}
        multiline={true}
        placeholder={t('descriptionPlaceholder')}
        value={description}
        onChangeText={setDescription}
      />
      <View
        style={{
          flex: 1,
          rowGap: 8,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16, opacity: 0.6 }}>
          {t('requestAmount')}
        </Text>
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            columnGap: 8,
            alignItems: 'center',
          }}
        >
          <FiatAmountInput
            autoFocus={true}
            amount={usdAmount}
            onInputChange={setUsdAmount}
          />
        </View>
        {!isAmountWithinLimit && (
          <Text style={{ color: colors.warning, fontSize: 16 }}>
            {t('amountLimitExceeded', {
              amount: ASK_AMOUNT_LIMIT_USD.toLocaleString(),
            })}
          </Text>
        )}
      </View>
      <StyledButton
        disabled={!canCreateRequest}
        variant="primary"
        title={t('createRequest')}
        isLoading={isCreatingAngelRequest}
        onPress={onNextPress}
      />
    </View>
  );
};

export default AskForAngel;
