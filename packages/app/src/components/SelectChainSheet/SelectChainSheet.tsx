import StyledText from '@/components/StyledText/StyledText';
import { getChainIcon, triggerHapticFeedback } from '@/lib/utils';
import { getChainFromId, getChainName, Token } from '@raylac/shared';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Chain } from 'viem';
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import colors from '@/lib/styles/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChainListItem = ({ chain }: { chain: Chain }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
      }}
    >
      <Image
        source={getChainIcon(chain.id)}
        style={{ width: 32, height: 32 }}
      ></Image>
      <StyledText>{getChainName(chain.id)}</StyledText>
    </View>
  );
};

const SelectChainSheet = ({
  title,
  open,
  token,
  onSelect,
  onClose,
}: {
  title: string;
  open: boolean;
  token: Token;
  onSelect: (chain: Chain) => void;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

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
        rowGap: 16,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 156,
        paddingHorizontal: 16,
      }}
      index={0}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['70%']}
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
          {title}
        </StyledText>
      </View>
      <BottomSheetFlatList
        data={token.addresses.map(address => address.chainId)}
        contentContainerStyle={{ rowGap: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              triggerHapticFeedback();
              onSelect(getChainFromId(item));
            }}
          >
            <ChainListItem chain={getChainFromId(item)} />
          </Pressable>
        )}
      />
    </BottomSheetModal>
  );
};

export default SelectChainSheet;
