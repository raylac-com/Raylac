import { useMutation } from '@tanstack/react-query';
import { Hex } from 'viem';
import {
  generateStealthAddress,
  getPublicClient,
  getStealthAddress,
} from '@sutori/shared';
import { StealthAccount } from '@/types';
import { publicKeyToAddress } from 'viem/accounts';

const client = getPublicClient();

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

      const stealthSigner = publicKeyToAddress(stealthPubKey);
      const address = await getStealthAddress({
        client,
        stealthSigner,
      });

      const stealthAccount: StealthAccount = {
        address,
        stealthPubKey,
        ephemeralPubKey,
        viewTag,
      };

      return stealthAccount;
    },
  });
};

export default useGenerateStealthAccount;
