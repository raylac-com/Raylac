import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hex } from 'viem';
import WalletIconAddress from '../WalletIconAddress/WalletIconAddress';
import { AddressType } from '@/types';
import StyledText from '../StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { View } from 'react-native';
import StyledButton from '../StyledButton/StyledButton';
import useLoadPrivateKey from '@/hooks/useLoadPrivateKey';
import { copyToClipboard } from '@/lib/utils';
import Toast from 'react-native-toast-message';

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
  const { privateKey, loadPrivateKey, hidePrivateKey } =
    useLoadPrivateKey(address);

  useEffect(() => {
    ref.current?.present();
  }, []);

  const onCopyPress = async () => {
    if (!privateKey) {
      throw new Error('Private key not found');
    }

    await copyToClipboard(privateKey);

    Toast.show({
      type: 'success',
      text1: 'Copied to clipboard',
    });
  };

  const onViewPrivKeyPress = async () => {
    await loadPrivateKey();
  };

  const onHidePress = () => {
    hidePrivateKey();
  };

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
      snapPoints={['70%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          rowGap: 24,
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ rowGap: 32 }}>
          <StyledText
            style={{ fontWeight: 'bold' }}
          >{`Address Details`}</StyledText>
          <View style={{ rowGap: 16 }}>
            <WalletIconAddress address={address} />
            <View
              style={{
                flexDirection: 'row',
                columnGap: 8,
                justifyContent: 'space-between',
              }}
            >
              <StyledText
                style={{ color: colors.subbedText }}
              >{`Type`}</StyledText>
              <StyledText style={{ fontWeight: 'bold', color: colors.border }}>
                {getAddressTypeLabel(addressType)}
              </StyledText>
            </View>
          </View>
        </View>
        {privateKey && (
          <StyledText
            style={{
              color: colors.subbedText,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {privateKey}
          </StyledText>
        )}

        {addressType === AddressType.PrivateKey && (
          <View style={{ width: '100%' }}>
            {privateKey ? (
              <View style={{ rowGap: 12 }}>
                <StyledButton
                  icon={
                    <Feather name="copy" size={16} color={colors.background} />
                  }
                  onPress={onCopyPress}
                  title={`Copy`}
                />
                <StyledButton
                  onPress={onHidePress}
                  variant="outline"
                  title={`Close`}
                />
              </View>
            ) : (
              <StyledButton
                onPress={onViewPrivKeyPress}
                icon={
                  <Feather name="key" size={16} color={colors.background} />
                }
                title={`View private key`}
              />
            )}
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default AddressDetailsSheet;
