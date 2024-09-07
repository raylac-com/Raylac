import { useMutation } from '@tanstack/react-query';
import { Hex } from 'viem';
import { generateStealthAddress, StealthAccount } from '@raylac/shared';
import { publicKeyToAddress } from 'viem/accounts';

/**
 * Hook to generate a new stealth address for the given public spending/viewing key pair
 */
const useGenerateStealthAccount = () => {
  return useMutation({
    mutationFn: async ({
      viewingPubKey,
      spendingPubKey,
    }: {
      viewingPubKey: Hex;
      spendingPubKey: Hex;
    }) => {
      const { ephemeralPubKey, viewTag, stealthPubKey } =
        generateStealthAddress({
          viewingPubKey,
          spendingPubKey,
        });

      const stealthAddress = publicKeyToAddress(stealthPubKey);

      const stealthAccount: StealthAccount = {
        address: stealthAddress,
        stealthPubKey,
        ephemeralPubKey,
        viewTag,
      };

      return stealthAccount;
    },
  });
};

export default useGenerateStealthAccount;
