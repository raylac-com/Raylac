import StyledText from '@/components/StyledText/StyledText';
import { triggerHapticFeedback } from '@/lib/utils';
import { Token, TokenAmount } from '@raylac/shared';
import { Pressable, View } from 'react-native';
import { Hex } from 'viem';
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import colors from '@/lib/styles/colors';
import useAddressTokenBalance from '@/hooks/useAddressTokenBalance';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChainTokenListItem = ({
  chainId,
  token,
  balance,
}: {
  chainId: number;
  token: Token;
  balance: TokenAmount;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
      }}
    >
      <TokenLogoWithChain chainId={chainId} logoURI={token.logoURI} size={42} />
      <StyledText style={{ color: colors.subbedText }}>
        {`$${balance.usdValueFormatted} ${token.symbol}`}
      </StyledText>
    </View>
  );
};

const SelectTokenChainSheet = ({
  open,
  token,
  address,
  onSelect,
  onClose,
}: {
  open: boolean;
  token: Token;
  address: Hex;
  onSelect: (chainId: number) => void;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  const addressTokenBalance = useAddressTokenBalance({ address, token });

  useEffect(() => {
    if (open) {
      triggerHapticFeedback();
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [open]);

  return (
    <BottomSheetModal
      ref={ref}
      style={{
        flex: 1,
        paddingHorizontal: 16,
        rowGap: 16,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
      }}
      index={0}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['100%']}
    >
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <StyledText
          style={{
            color: colors.subbedText,
          }}
        >
          {`Select input token chain`}
        </StyledText>
      </View>
      <BottomSheetFlatList
        data={addressTokenBalance?.chainBalances}
        contentContainerStyle={{ rowGap: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              triggerHapticFeedback();
              onSelect(item.chainId);
            }}
          >
            <ChainTokenListItem
              chainId={item.chainId}
              token={token}
              balance={item.balance}
            />
          </Pressable>
        )}
      />
    </BottomSheetModal>
  );
};

export default SelectTokenChainSheet;
