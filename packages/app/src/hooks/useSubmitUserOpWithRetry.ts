import { trpc } from '@/lib/trpc';
import { useMutation } from '@tanstack/react-query';
import {
  encodePaymasterAndData,
  increaseByPercent,
  RAYLAC_PAYMASTER_ADDRESS,
  signUserOpWithStealthAccount,
  StealthAddressWithEphemeral,
  UserOperation,
} from '@raylac/shared';
import { Hex, hexToBigInt, toHex } from 'viem';

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
      const maxRetries = 5;
      let retries = 0;

      let currentMaxFeePerGas;
      let currentMaxPriorityFeePerGas;

      while (retries < maxRetries) {
        try {
          if (retries > 0) {
            // Increase maxFeePerGas and maxPriorityFeePerGas by 10%
            userOp = {
              ...userOp,
              maxFeePerGas: toHex(
                increaseByPercent({
                  value: currentMaxFeePerGas,
                  percent: 10,
                })
              ),
              maxPriorityFeePerGas: toHex(
                increaseByPercent({
                  value: currentMaxPriorityFeePerGas,
                  percent: 10,
                })
              ),
            };

            console.log(`Retrying with increased gas fees...`);
            console.log(
              `maxFeePerGas: ${hexToBigInt(userOp.maxFeePerGas).toLocaleString()}`
            );
            console.log(
              `maxPriorityFeePerGas: ${hexToBigInt(userOp.maxPriorityFeePerGas).toLocaleString()}`
            );
          }

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

          return;
        } catch (error) {
          if (error.message === 'replacement underpriced') {
            console.log(`Replacement underpriced}`);
            console.log(error.data);

            // Assign the current maxFeePerGas and maxPriorityFeePerGas from the error
            currentMaxFeePerGas = hexToBigInt(error.data.currentMaxFee);
            currentMaxPriorityFeePerGas = hexToBigInt(
              error.data.currentMaxPriorityFee
            );
          } else {
            // Assign the current maxFeePerGas and maxPriorityFeePerGas from the userOp
            currentMaxFeePerGas = hexToBigInt(userOp.maxFeePerGas);
            currentMaxPriorityFeePerGas = hexToBigInt(
              userOp.maxPriorityFeePerGas
            );
          }

          retries++;
          console.log(`Error submitting user op. Retrying...`);
          console.log(error);
        }
      }

      throw new Error('Failed to submit user operation');
    },
  });
};

export default useSubmitUserOpWithRetry;
