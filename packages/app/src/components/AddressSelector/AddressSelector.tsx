import { shortenAddress } from '@/lib/utils';
import ChainLogo from '@/components/ChainLogo/ChainLogo';
import { getChainFromId, supportedChains } from '@raylac/shared';
import Entypo from '@expo/vector-icons/Entypo';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { Hex } from 'viem';
import SelectAddressSheet from '../SelectAddressSheet/SelectAddressSheet';

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
      <ChainLogo chainId={chainId} size={16} />
      <StyledText>{getChainFromId(chainId).name}</StyledText>
    </Pressable>
  );
};

export const AddressSelectorSheet = ({
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

interface AddressSelectorProps {
  address: Hex;
  setAddress: (address: Hex) => void;
}

const AddressSelector = ({ address, setAddress }: AddressSelectorProps) => {
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
  return (
    <View>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        onPress={() => setIsAddressSheetOpen(true)}
      >
        <StyledText>{shortenAddress(address)}</StyledText>
        <Entypo name="chevron-down" size={20} color={colors.border} />
      </Pressable>
      <SelectAddressSheet
        open={isAddressSheetOpen}
        onClose={() => setIsAddressSheetOpen(false)}
        onSelect={address => {
          setAddress(address);
          setIsAddressSheetOpen(false);
        }}
      />
    </View>
  );
};

export default AddressSelector;
