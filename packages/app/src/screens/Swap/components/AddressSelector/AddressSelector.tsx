import StyledText from '@/components/StyledText/StyledText';
import SelectAddressSheet from '@/components/SelectAddressSheet/SelectAddressSheet';
import { View } from 'react-native';
import { useState } from 'react';
import { Hex } from 'viem';
import WalletIconAddress from '@/components/WalletIconAddress/WalletIconAddress';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import colors from '@/lib/styles/colors';

interface AddressSelectorProps {
  selectedAddress: Hex | null;
  setSelectedAddress: (address: Hex) => void;
}

const AddressSelector = ({
  selectedAddress,
  setSelectedAddress,
}: AddressSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderColor: colors.border,
      }}
    >
      <FeedbackPressable onPress={() => setIsOpen(true)}>
        {selectedAddress ? (
          <WalletIconAddress address={selectedAddress} />
        ) : (
          <StyledText>{`Select an address`}</StyledText>
        )}
      </FeedbackPressable>
      <SelectAddressSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={address => {
          setSelectedAddress(address);
          setIsOpen(false);
        }}
      />
    </View>
  );
};

export default AddressSelector;
