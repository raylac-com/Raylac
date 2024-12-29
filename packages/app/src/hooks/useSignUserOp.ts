import { useMutation } from '@tanstack/react-query';
import {
  getUserOpHash,
  getSenderAddressV2,
  UserOperation,
} from '@raylac/shared';
import { Account } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getPrivateKey, getUserAddresses } from '@/lib/key';

const signUserOps = async (userOps: UserOperation[], account: Account) => {
  const sender = getSenderAddressV2({
    singerAddress: account.address,
  });

  const signedUserOps = await Promise.all(
    userOps.map(async userOp => {
      const userOpHash = getUserOpHash({
        userOp,
      });

      if (userOp.sender !== sender) {
        throw new Error(`Sender mismatch: ${userOp.sender} !== ${sender}`);
      }

      const sig = await account.signMessage!({
        message: {
          raw: userOpHash,
        },
      });

      return {
        ...userOp,
        signature: sig,
      };
    })
  );

  return signedUserOps;
};

const useSignUserOps = () => {
  return useMutation({
    mutationFn: async (userOps: UserOperation[]) => {
      const addresses = await getUserAddresses();

      const privKey = await getPrivateKey(addresses[0]);

      if (!privKey) {
        throw new Error('Private key not found');
      }

      const account = privateKeyToAccount(privKey);
      const signedUserOps = await signUserOps(userOps, account);
      return signedUserOps;
    },
  });
};

export default useSignUserOps;
