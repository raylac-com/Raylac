import AsyncStorage from '@react-native-async-storage/async-storage';
import { HDKey, hdKeyToAccount } from 'viem/accounts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { Buffer } from 'buffer';
import * as bip39 from 'bip39';
import userKeys from '@/queryKeys/userKeys';
import {
  getMnemonic,
  saveMnemonic,
  saveSpendingPrivKey,
  saveViewingPrivKey,
} from '@/lib/key';
import { Hex } from 'viem';
import { saveAuthToken } from '@/lib/auth';

globalThis.Buffer = Buffer;

const hdKeyToPrivateKey = (hdKey: HDKey): Hex => {
  return `0x${Buffer.from(hdKey.privateKey).toString('hex')}`;
};

const saveSignedInUser = async (userId: number) => {
  await AsyncStorage.setItem('signedInUser', userId.toString());
};

const initAccount = async (): Promise<{
  spendingPubKey: Hex;
  viewingPrivKey: Hex;
}> => {
  const mnemonicInStore = await getMnemonic();

  const mnemonic = mnemonicInStore ? mnemonicInStore : bip39.generateMnemonic();
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const hdKey = HDKey.fromMasterSeed(seed);

  const spendingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  const viewingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 1,
  });

  const spendingPrivKey = hdKeyToPrivateKey(spendingAccount.getHdKey());
  const viewingPrivKey = hdKeyToPrivateKey(viewingAccount.getHdKey());

  await Promise.all([
    saveMnemonic(mnemonic),
    saveSpendingPrivKey(spendingPrivKey),
    saveViewingPrivKey(viewingPrivKey),
  ]);

  return {
    spendingPubKey: spendingAccount.publicKey,
    viewingPrivKey,
  };
};

const useSignUp = () => {
  const { mutateAsync: signUp } = trpc.signUp.useMutation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      username,
    }: {
      name: string;
      username: string;
    }) => {
      const { spendingPubKey, viewingPrivKey } = await initAccount();

      const { userId, token } = await signUp({
        name,
        username,
        spendingPubKey,
        viewingPrivKey,
      });

      await saveSignedInUser(userId);
      await saveAuthToken(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [userKeys.isSignedIn],
      });
      queryClient.invalidateQueries({
        queryKey: [userKeys.signedInUser],
      });
    },
  });
};

export default useSignUp;
