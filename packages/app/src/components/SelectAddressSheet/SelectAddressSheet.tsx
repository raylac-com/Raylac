import StyledText from '@/components/StyledText/StyledText';
import { Pressable, View } from 'react-native';
import { Hex } from 'viem';
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import colors from '@/lib/styles/colors';
import { triggerHapticFeedback } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useWriterAddresses from '@/hooks/useWriterAddresses';
import WalletIconAddress from '../WalletIconAddress/WalletIconAddress';

const AddressListItem = ({ address }: { address: Hex }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
      }}
    >
      <WalletIconAddress address={address} />
    </View>
  );
};

const SelectAddressSheet = ({
  open,
  onSelect,
  onClose,
}: {
  open: boolean;
  onSelect: (address: Hex) => void;
  onClose: () => void;
}) => {
  const { data: writerAddresses } = useWriterAddresses();
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

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
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 16,
        rowGap: 16,
      }}
      onDismiss={onClose}
      index={1}
      enablePanDownToClose
      enableDynamicSizing={true}
      snapPoints={['50%', '100%']}
    >
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
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
        data={writerAddresses}
        style={{
          marginTop: 24,
        }}
        contentContainerStyle={{
          rowGap: 16,
        }}
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
