import { trpc } from '@/lib/trpc';
import { useMutation } from '@tanstack/react-query';
import {
  encodePaymasterAndData,
  getUserOpHash,
  RAYLAC_PAYMASTER_ADDRESS,
  signUserOpWithStealthAccount,
  StealthAddressWithEphemeral,
  submitUserOpWithRetry,
  UserOperation,
} from '@raylac/shared';
import { Hex } from 'viem';

const useSubmitUserOpWithRetry = () => {
  const { mutateAsync: submitUserOp } = trpc.submitUserOperation.useMutation({
    throwOnError: false,
    retry: false,
  });
  const { mutateAsync: paymasterSignUserOp } = trpc.signUserOp.useMutation();

  return useMutation({
    mutationFn: async ({
      userOp,
      stealthAccount,
      spendingPrivKey,
      viewingPrivKey,
    }: {
      userOp: UserOperation;
      stealthAccount: StealthAddressWithEphemeral;
      spendingPrivKey: Hex;
      viewingPrivKey: Hex;
    }) => {
      await submitUserOpWithRetry({
        userOp,
        signAndSubmitUserOp: async userOp => {
          // Get the paymaster signature
          const paymasterAndData = encodePaymasterAndData({
            paymaster: RAYLAC_PAYMASTER_ADDRESS,
            data: await paymasterSignUserOp({ userOp }),
          });
          userOp.paymasterAndData = paymasterAndData;

          // Sign the user operation with the stealth account
          const signedUserOp = await signUserOpWithStealthAccount({
            userOp,
            stealthAccount,
            spendingPrivKey,
            viewingPrivKey,
          });

          // Submit the user operation
          await submitUserOp({ userOp: signedUserOp });

          return getUserOpHash({ userOp: signedUserOp });
        },
      });
    },
  });
};

export default useSubmitUserOpWithRetry;
