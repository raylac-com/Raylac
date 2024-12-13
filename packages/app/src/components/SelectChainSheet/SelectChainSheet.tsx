import StyledText from '@/components/StyledText/StyledText';
import { getChainIcon } from '@/lib/utils';
import { supportedChains } from '@raylac/shared';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Chain } from 'viem';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import colors from '@/lib/styles/colors';

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
  onSelect,
  onClose,
}: {
  onSelect: (chain: Chain) => void;
  onClose: () => void;
}) => {
  const ref = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      ref={ref}
      style={{
        flex: 1,
        padding: 16,
        rowGap: 16,
      }}
      index={0}
      onClose={onClose}
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
          <Pressable onPress={() => onSelect(item)}>
            <ChainListItem chain={item} />
          </Pressable>
        )}
      />
    </BottomSheet>
  );
};

export default SelectChainSheet;
