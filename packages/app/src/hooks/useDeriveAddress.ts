import {
  getAccountFromMnemonic,
  getMnemonic,
  getUserAddresses,
  saveUserAddress,
} from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { AddressType, UserAddress } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const deriveAddress = async (fromAddress: UserAddress) => {
  if (fromAddress.type === AddressType.PrivateKey) {
    throw new Error('Cannot derive address from private key');
  }

  if (fromAddress.type === AddressType.Watch) {
    throw new Error('Cannot derive address from watch address');
  }

  if (fromAddress.accountIndex !== 0) {
    throw new Error('Account index must be 0');
  }

  const addresses = await getUserAddresses();
  const addressesInMnemonicGroup = addresses.filter(
    address => address.mnemonicGenesisAddress === fromAddress.address
  );

  const lastAccountIndex =
    // Sort by account index
    addressesInMnemonicGroup.sort(
      (a, b) => b.accountIndex! - a.accountIndex!
    )[0]?.accountIndex ?? 0;

  const newAccountIndex = lastAccountIndex + 1;

  const mnemonic = await getMnemonic(fromAddress.address);

  if (!mnemonic) {
    throw new Error('Mnemonic not found');
  }

  const { account } = await getAccountFromMnemonic({
    mnemonic,
    accountIndex: newAccountIndex,
  });

  await saveUserAddress({
    address: account.address,
    type: AddressType.Mnemonic,
    accountIndex: newAccountIndex,
    mnemonicGenesisAddress: fromAddress.address,
    isBackupVerified: true,
    isDefault: false,
  });

  return account;
};

const useDeriveAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fromAddress: UserAddress) => {
      const account = await deriveAddress(fromAddress);

      await queryClient.invalidateQueries({
        queryKey: userKeys.userAddresses,
      });

      return account;
    },
  });
};

export default useDeriveAddress;
