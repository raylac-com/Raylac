import { getChainIcon } from '@/lib/utils';
import { getChainFromId, Token } from '@raylac/shared';
import { Image } from 'expo-image';
import Entypo from '@expo/vector-icons/Entypo';
import { supportedChains } from '@raylac/shared';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { Hex } from 'viem';
import SelectTokenChainSheet from '../SelectTokenChainSheet/SelectTokenChainSheet';

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

export const TokenChainSelectorSheet = ({
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

interface TokenChainSelectorProps {
  token: Token;
  address: Hex;
  chainId: number;
  setChainId: (chainId: number) => void;
}

const TokenChainSelector = ({
  token,
  address,
  chainId,
  setChainId,
}: TokenChainSelectorProps) => {
  const [isChainsSheetOpen, setIsChainsSheetOpen] = useState(false);

  return (
    <View>
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
        onPress={() => setIsChainsSheetOpen(true)}
      >
        <Image
          source={getChainIcon(chainId)}
          style={{ width: 16, height: 16 }}
        />
        <StyledText>{getChainFromId(chainId).name}</StyledText>
        <Entypo name="chevron-down" size={20} color={colors.border} />
      </Pressable>
      <SelectTokenChainSheet
        open={isChainsSheetOpen}
        token={token}
        address={address}
        onSelect={chainId => {
          setChainId(chainId);
          setIsChainsSheetOpen(false);
        }}
        onClose={() => {
          setIsChainsSheetOpen(false);
        }}
      />
    </View>
  );
};

export default TokenChainSelector;