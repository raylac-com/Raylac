import StyledText from '@/components/StyledText/StyledText';
import { shortenAddress } from '@/lib/utils';
import { Pressable, View } from 'react-native';
import { Hex } from 'viem';
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import colors from '@/lib/styles/colors';
import { triggerHapticFeedback } from '@/lib/utils';
import useUserAddresses from '@/hooks/useUserAddresses';

const AddressListItem = ({ address }: { address: Hex }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
      }}
    >
      <StyledText>{shortenAddress(address)}</StyledText>
    </View>
  );
};

const SelectAddressSheet = ({
  open,
  onSelect,
}: {
  open: boolean;
  onSelect: (address: Hex) => void;
}) => {
  const { data: addresses } = useUserAddresses();
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
          {`Select address`}
        </StyledText>
      </View>
      <BottomSheetFlatList
        data={addresses}
        contentContainerStyle={{ rowGap: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              triggerHapticFeedback();
              onSelect(item.address);
            }}
          >
            <AddressListItem address={item.address} />
          </Pressable>
        )}
      />
    </BottomSheetModal>
  );
};

export default SelectAddressSheet;
