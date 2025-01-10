import { getChainIcon } from '@/lib/utils';
import { getChainFromId } from '@raylac/shared';
import { Image } from 'expo-image';
import Feather from '@expo/vector-icons/Feather';
import { supportedChains } from '@raylac/shared';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import SelectChainSheet from '@/components/SelectChainSheet/SelectChainSheet';

const ChainListItem = ({
  chainId,
  onPress,
}: {
  chainId: number;
  onPress: () => void;
}) => {
  return (
    <Pressable
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
      onPress={onPress}
    >
      <Image source={getChainIcon(chainId)} style={{ width: 24, height: 24 }} />
      <StyledText>{getChainFromId(chainId).name}</StyledText>
    </Pressable>
  );
};

export const ChainSelectorSheet = ({
  onSelectChain,
  onClose,
}: {
  onSelectChain: (chainId: number) => void;
  onClose: () => void;
}) => {
  const ref = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      ref={ref}
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 32,
      }}
      index={0}
      snapPoints={['100%']}
      enablePanDownToClose
      onClose={onClose}
    >
      <BottomSheetFlatList
        data={supportedChains}
        contentContainerStyle={{
          marginTop: 14,
          rowGap: 16,
        }}
        renderItem={({ item }: { item: (typeof supportedChains)[number] }) => {
          return (
            <ChainListItem
              chainId={item.id}
              onPress={() => {
                onSelectChain(item.id);
              }}
            />
          );
        }}
      />
    </BottomSheet>
  );
};

interface ChainSelectorProps {
  title: string;
  chainId: number;
  setChainId: (chainId: number) => void;
}

const ChainSelector = ({ title, chainId, setChainId }: ChainSelectorProps) => {
  const [isChainsSheetOpen, setIsChainsSheetOpen] = useState(false);

  return (
    <View>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        onPress={() => setIsChainsSheetOpen(true)}
      >
        <Image
          source={getChainIcon(chainId)}
          style={{ width: 16, height: 16 }}
        />
        <StyledText>{getChainFromId(chainId).name}</StyledText>
        <Feather name="chevron-down" size={20} color={colors.border} />
      </Pressable>
      <SelectChainSheet
        title={title}
        open={isChainsSheetOpen}
        onSelect={chain => {
          setChainId(chain.id);
          setIsChainsSheetOpen(false);
        }}
        onClose={() => {
          setIsChainsSheetOpen(false);
        }}
      />
    </View>
  );
};

export default ChainSelector;
