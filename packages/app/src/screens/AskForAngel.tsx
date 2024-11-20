import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import colors from '@/lib/styles/colors';
import { useCallback, useState } from 'react';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { trpc } from '@/lib/trpc';
import FiatAmountInput from '@/components/FiatAmountInput';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import fontSizes from '@/lib/styles/fontSizes';
import MultiLineInput from '@/components/MultiLineInput';
import spacing from '@/lib/styles/spacing';
import StyledTextInput from '@/components/StyledTextInput';
import InputLabel from '@/components/InputLabel';

const ASK_AMOUNT_LIMIT_USD = 5000;

const AskForAngel = () => {
  const { t } = useTranslation('AskForAngel');
  const [usdAmount, setUsdAmount] = useState<string>('');

  const [description, setDescription] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  const { mutateAsync: createAngelRequest, isPending: isCreatingAngelRequest } =
    trpc.createAngelRequest.useMutation();

  const queryClient = useQueryClient();

  const navigation = useTypedNavigation();

  const isAmountWithinLimit =
    !usdAmount || parseFloat(usdAmount) <= ASK_AMOUNT_LIMIT_USD;

  const onNextPress = useCallback(async () => {
    const angelRequest = await createAngelRequest({
      title,
      description,
      usdAmount,
    });

    queryClient.invalidateQueries({
      queryKey: getQueryKey(trpc.getUserAngelRequests),
    });

    if (angelRequest) {
      navigation.navigate('ConfirmAskForAngel', {
        title,
        description,
        usdAmount,
        angelRequestId: angelRequest.id!,
      });
    }
  }, [description, title, usdAmount]);

  const canCreateRequest = description && title && usdAmount;

  return (
    <ScrollView
      contentContainerStyle={{
        alignItems: 'center',
        paddingHorizontal: spacing.small,
        paddingTop: spacing.small,
        paddingBottom: spacing.large,
        width: '100%',
        rowGap: spacing.small,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: fontSizes.large,
          fontWeight: 'bold',
        }}
      >
        {t('writeARequest')}
      </Text>
      <Text style={{ color: colors.text, fontSize: fontSizes.base }}>
        {t('angelDescription')}
      </Text>
      <View
        style={{
          width: '100%',
          flexDirection: 'column',
          rowGap: spacing.xxSmall,
          justifyContent: 'flex-start',
        }}
      >
        <InputLabel label={t('titleLabel')} />
        <StyledTextInput
          autoFocus
          placeholder={t('titlePlaceholder')}
          value={title}
          onChangeText={setTitle}
        />
      </View>
      <View
        style={{
          flexDirection: 'column',
          width: '100%',
          rowGap: spacing.xxSmall,
        }}
      >
        <InputLabel label={t('descriptionLabel')} />
        <MultiLineInput
          placeholder={t('descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
        />
      </View>
      <View
        style={{
          flexDirection: 'column',
          width: '100%',
          rowGap: spacing.xxSmall,
        }}
      >
        <InputLabel label={t('requestAmount')} />
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            columnGap: spacing.xxSmall,
            alignItems: 'center',
          }}
        >
          <FiatAmountInput amount={usdAmount} onInputChange={setUsdAmount} />
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
        style={{ marginTop: spacing.large }}
      />
    </ScrollView>
  );
};

export default AskForAngel;
