import { useMutation } from '@tanstack/react-query';
import {
  getUserOpHash,
  getSenderAddressV2,
  UserOperation,
} from '@raylac/shared';
import { getSignerAccount } from '@/lib/key';
import { HDAccount } from 'viem';

const signUserOps = async (userOps: UserOperation[], hdAccount: HDAccount) => {
  const sender = getSenderAddressV2({
    singerAddress: hdAccount.address,
  });

  const signedUserOps = await Promise.all(
    userOps.map(async userOp => {
      const userOpHash = getUserOpHash({
        userOp,
      });

      if (userOp.sender !== sender) {
        throw new Error(`Sender mismatch: ${userOp.sender} !== ${sender}`);
      }

      const sig = await hdAccount.signMessage({
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
      const hdAccount = await getSignerAccount();
      const signedUserOps = await signUserOps(userOps, hdAccount);
      return signedUserOps;
    },
  });
};

export default useSignUserOps;
