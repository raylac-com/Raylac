import FastAvatar from '@/components/FastAvatar';
import StyledButton from '@/components/StyledButton';
import useMultiChainSend from '@/hooks/useMultiChainSend';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import opacity from '@/lib/styles/opacity';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { Hex, parseUnits } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

// Make the actual angel transfer.
// Create a transfer transaction with angel request id.

type Props = NativeStackScreenProps<RootStackParamsList, 'AngelTransfer'>;

const AngelTransfer = ({ route }: Props) => {
  const { angelRequestId } = route.params;

  const tokenId = 'usdc';
  const tokenPrice = 1;

  const { data: angelRequest, isPending } = trpc.getAngelRequest.useQuery({
    angelRequestId,
  });

  const { mutateAsync: send } = useMultiChainSend();

  const onPayPress = useCallback(async () => {
    if (!angelRequest) {
      throw new Error(`Angel request not found id: ${angelRequestId}`);
    }

    const parsedAmount = parseUnits(angelRequest.amount!, 6);

    await send({
      amount: parsedAmount,
      tokenId,
      recipientUserOrAddress: angelRequest.user,
      tokenPrice,
    });
  }, [angelRequest, send]);

  if (!angelRequest) {
    return null;
  }

  if (!isPending && !angelRequest) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
          {`Angel request not found`}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.small,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          rowGap: spacing.small,
        }}
      >
        <FastAvatar
          address={publicKeyToAddress(angelRequest?.user.spendingPubKey as Hex)}
          size={80}
          imageUrl={angelRequest?.user.profileImage}
        ></FastAvatar>
        <Text
          style={{
            fontSize: fontSizes.large,
            fontWeight: 'bold',
            textAlign: 'center',
            color: colors.text,
          }}
        >
          {angelRequest?.user.name}
        </Text>
        <Text
          style={{
            fontSize: fontSizes.base,
            textAlign: 'center',
            color: colors.text,
            opacity: opacity.dimmed,
          }}
        >
          {angelRequest?.description}
        </Text>
        <Text
          style={{
            fontSize: fontSizes.base,
            textAlign: 'center',
            color: colors.text,
          }}
        >
          {`${angelRequest.amount} USD`}
        </Text>
      </View>
      <StyledButton
        variant="primary"
        title="Pay"
        onPress={onPayPress}
      ></StyledButton>
    </View>
  );
};

export default AngelTransfer;
