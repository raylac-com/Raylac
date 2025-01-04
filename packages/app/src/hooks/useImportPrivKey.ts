import { savePrivateKey, saveUserAddress, getDefaultAddress } from '@/lib/key';
import userKeys from '@/queryKeys/userKeys';
import { AddressType } from '@/types';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const useImportPrivKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ privKey }: { privKey: Hex }) => {
      await sleep(300);
      const account = privateKeyToAccount(privKey);

      await savePrivateKey({ address: account.address, privKey });

      const defaultAddress = await getDefaultAddress();

      await saveUserAddress({
        address: account.address,
        type: AddressType.PrivateKey,
        isBackupVerified: true,
        isDefault: defaultAddress ? false : true,
      });

      await queryClient.invalidateQueries({
        queryKey: userKeys.userAddresses,
      });

      await sleep(300);
    },
  });
};

export default useImportPrivKey;
