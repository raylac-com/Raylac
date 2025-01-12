import StyledText from '@/components/StyledText/StyledText';
import SelectAddressSheet from '@/components/SelectAddressSheet/SelectAddressSheet';
import { View } from 'react-native';
import { useState } from 'react';
import { Hex } from 'viem';
import WalletIconAddress from '@/components/WalletIconAddress/WalletIconAddress';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import colors from '@/lib/styles/colors';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
interface AddressSelectorProps {
  selectedAddress: Hex | null;
  setSelectedAddress: (address: Hex) => void;
}

const AddressSelector = ({
  selectedAddress,
  setSelectedAddress,
}: AddressSelectorProps) => {
  const { t } = useTranslation('AddressSelector');
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
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          {selectedAddress ? (
            <WalletIconAddress address={selectedAddress} />
          ) : (
            <StyledText>{t('selectAddress')}</StyledText>
          )}
          <Feather name="chevron-up" size={24} color={colors.subbedText} />
        </View>
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
