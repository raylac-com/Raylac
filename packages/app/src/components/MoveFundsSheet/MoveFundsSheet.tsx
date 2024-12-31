import AddressSelector from '@/components/AddressSelector/AddressSelector';
import useUserAddresses from '@/hooks/useUserAddresses';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Hex } from 'viem';

const MoveFundsSheet = ({ open }: { open: boolean }) => {
  const { data: userAddresses } = useUserAddresses();
  const [fromAddress, setFromAddress] = useState<Hex | null>(null);
  const [toAddress, setToAddress] = useState<Hex | null>(null);
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (userAddresses) {
      if (userAddresses.length > 0) {
        setFromAddress(userAddresses[0].address);
      }

      if (userAddresses.length > 1) {
        setToAddress(userAddresses[1].address);
      }
    }
  }, [userAddresses]);

  useEffect(() => {
    if (open) {
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
      }}
      index={0}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['100%']}
    >
      <View>
        {toAddress && (
          <AddressSelector address={toAddress} setAddress={setToAddress} />
        )}
        {fromAddress && (
          <AddressSelector address={fromAddress} setAddress={setFromAddress} />
        )}
      </View>
    </BottomSheetModal>
  );
};

export default MoveFundsSheet;
