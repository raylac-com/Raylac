import {
  getAccountFromMnemonic,
  getMnemonic,
  getUserAddresses,
  saveUserAddress,
} from '@/lib/key';
import { AddressType, UserAddress } from '@/types';
import { useMutation } from '@tanstack/react-query';

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

  const mnemonic = await getMnemonic(fromAddress.address);

  if (!mnemonic) {
    throw new Error('Mnemonic not found');
  }

  const newAccountIndex = fromAddress.accountIndex + 1;
  const addresses = await getUserAddresses();

  const addressesInMnemonicGroup = addresses.filter(
    address => address.mnemonicGenesisAddress === fromAddress.address
  );

  const lastAccountIndex =
    addressesInMnemonicGroup.sort(
      (a, b) => a.accountIndex! - b.accountIndex!
    )[0]?.accountIndex ?? 0;

  const { account } = await getAccountFromMnemonic({
    mnemonic,
    accountIndex: lastAccountIndex + 1,
  });

  await saveUserAddress({
    address: account.address,
    type: AddressType.Mnemonic,
    accountIndex: newAccountIndex,
  });

  return account;
};

const useDeriveAddress = () => {
  return useMutation({
    mutationFn: async (fromAddress: UserAddress) => {
      const account = await deriveAddress(fromAddress);

      return account;
    },
  });
};

export default useDeriveAddress;
