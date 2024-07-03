import { useMutation } from '@tanstack/react-query';
import viemClient from '@/lib/viemClient';
import { Hex } from 'viem';
import { generateStealthAddress, getStealthAddress } from '@sutori/shared';
import { StealthAccount } from '@/types';
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

      const stealthSigner = publicKeyToAddress(stealthPubKey);
      const address = await getStealthAddress({
        // @ts-ignore
        publicClient: viemClient,
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
