import { useMutation } from '@tanstack/react-query';
import {
  getUserOpHash,
  getSenderAddressV2,
  UserOperation,
} from '@raylac/shared';
import { getMnemonicAndPrivKey } from '@/lib/key';
import { Account } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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
      const mnemonicAndPrivKey = await getMnemonicAndPrivKey();

      if (!mnemonicAndPrivKey) {
        throw new Error('Mnemonic and private key not found');
      }

      const account = privateKeyToAccount(mnemonicAndPrivKey.privKey);
      const signedUserOps = await signUserOps(userOps, account);
      return signedUserOps;
    },
  });
};

export default useSignUserOps;
