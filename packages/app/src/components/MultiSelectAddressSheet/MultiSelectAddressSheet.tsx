import StyledText from '@/components/StyledText/StyledText';
import { Pressable, View } from 'react-native';
import { Hex } from 'viem';
import { UserAddress } from '@/types';
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import colors from '@/lib/styles/colors';
import { triggerHapticFeedback } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useWriterAddresses from '@/hooks/useWriterAddresses';
import useUserAddresses from '@/hooks/useUserAddresses';
import WalletIconAddress from '../WalletIconAddress/WalletIconAddress';
import { useTranslation } from 'react-i18next';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';

const AddressListItem = ({
  address,
  selected,
  onToggle,
}: {
  address: Hex;
  selected: boolean;
  onToggle: () => void;
}) => {
  const { data: userAddresses } = useUserAddresses();
  const userAddress = userAddresses?.find(
    (a: UserAddress) => a.address === address
  );

  return (
    <FeedbackPressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
      }}
      onPress={onToggle}
    >
      <WalletIconAddress address={address} label={userAddress?.label} />
      <View style={{ flex: 1 }} />
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.subbedText,
          backgroundColor: selected ? colors.primary : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    </FeedbackPressable>
  );
};

const MultiSelectAddressSheet = ({
  open,
  onSelect,
  onClose,
}: {
  open: boolean;
  onSelect: (addresses: Hex[]) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation('MultiSelectAddressSheet');
  const { data: writerAddresses } = useWriterAddresses();
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [selectedAddresses, setSelectedAddresses] = useState<Hex[]>([]);

  useEffect(() => {
    if (open) {
      triggerHapticFeedback();
      ref.current?.present();
    } else {
      ref.current?.dismiss();
      setSelectedAddresses([]);
    }
  }, [open]);

  const handleToggleAddress = (address: Hex) => {
    setSelectedAddresses(prev => {
      const isSelected = prev.includes(address);
      if (isSelected) {
        return prev.filter(a => a !== address);
      } else {
        return [...prev, address];
      }
    });
  };

  const handleConfirm = () => {
    onSelect(selectedAddresses);
    onClose();
  };

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
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <StyledText
          style={{
            color: colors.subbedText,
          }}
        >
          {`Select addresses`}
        </StyledText>
        <Pressable onPress={handleConfirm}>
          <StyledText
            style={{
              color:
                selectedAddresses.length > 0
                  ? colors.primary
                  : colors.subbedText,
            }}
          >
            {t('done')}
          </StyledText>
        </Pressable>
      </View>
      <BottomSheetFlatList
        data={writerAddresses}
        style={{
          marginTop: 24,
        }}
        contentContainerStyle={{
          rowGap: 20,
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              triggerHapticFeedback();
              handleToggleAddress(item.address);
            }}
          >
            <AddressListItem
              address={item.address}
              selected={selectedAddresses.includes(item.address)}
              onToggle={() => handleToggleAddress(item.address)}
            />
          </Pressable>
        )}
      />
    </BottomSheetModal>
  );
};

export default MultiSelectAddressSheet;
