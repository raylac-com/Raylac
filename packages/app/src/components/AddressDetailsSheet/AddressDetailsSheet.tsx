import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hex } from 'viem';
import WalletIconAddress from '../WalletIconAddress/WalletIconAddress';
import { AddressType } from '@/types';
import StyledText from '../StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { View } from 'react-native';

export interface AddressDetailsSheetProps {
  address: Hex;
  addressType: AddressType;
  onClose: () => void;
}

const AddressDetailsSheet = ({
  address,
  addressType,
  onClose,
}: AddressDetailsSheetProps) => {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    ref.current?.present();
  }, []);

  const getAddressTypeLabel = (type: AddressType): string => {
    switch (type) {
      case AddressType.Mnemonic:
        return 'Mnemonic';
      case AddressType.PrivateKey:
        return 'Private Key';
      case AddressType.Watch:
        return 'Watch-only';
      default:
        return 'Unknown';
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 32,
      }}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['50%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          width: '100%',
          flexDirection: 'column',
          rowGap: 24,
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ rowGap: 16 }}>
          <StyledText style={{ fontSize: 18, fontWeight: '600' }}>
            {`Address Details`}
          </StyledText>
          <WalletIconAddress address={address} />
          <View
            style={{ flexDirection: 'row', columnGap: 8, alignItems: 'center' }}
          >
            <StyledText
              style={{ color: colors.subbedText }}
            >{`Type:`}</StyledText>
            <StyledText>{getAddressTypeLabel(addressType)}</StyledText>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default AddressDetailsSheet;
