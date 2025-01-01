import StyledText from '@/components/StyledText/StyledText';
import { getChainIcon, hapticOptions } from '@/lib/utils';
import { supportedChains } from '@raylac/shared';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Chain } from 'viem';
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import colors from '@/lib/styles/colors';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

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
      <StyledText>{chain.name}</StyledText>
    </View>
  );
};

const SelectChainSheet = ({
  open,
  onSelect,
}: {
  open: boolean;
  onSelect: (chain: Chain) => void;
}) => {
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (open) {
      ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
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
        padding: 16,
        rowGap: 16,
      }}
      index={0}
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
          {`Select chain`}
        </StyledText>
      </View>
      <BottomSheetFlatList
        data={supportedChains}
        contentContainerStyle={{ rowGap: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
              onSelect(item);
            }}
          >
            <ChainListItem chain={item} />
          </Pressable>
        )}
      />
    </BottomSheetModal>
  );
};

export default SelectChainSheet;
