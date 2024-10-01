import 'dotenv/config';
import {
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  getInitCode,
  getPublicClient,
  getSenderAddress,
} from '@raylac/shared';
import {
  BaseError,
  ContractFunctionRevertedError,
  Hex,
  pad,
  zeroAddress,
} from 'viem';
import { privateKeyToAccount, publicKeyToAddress } from 'viem/accounts';
import { base } from 'viem/chains';

export const getSenderAddressAsync = async ({
  chainId,
  initCode,
}: {
  chainId: number;
  initCode: Hex;
}): Promise<Hex | undefined> => {
  try {
    // Simulate contract call from a random account
    const account = await privateKeyToAccount(pad('0x1'));

    const client = getPublicClient({ chainId });
    await client.simulateContract({
      address: ENTRY_POINT_ADDRESS,
      account,
      abi: EntryPointAbi,
      functionName: 'getSenderAddress',
      args: [initCode],
    });
  } catch (err: any) {
    if (err instanceof BaseError) {
      const revertError = err.walk(
        err => err instanceof ContractFunctionRevertedError
      );
      if (revertError instanceof ContractFunctionRevertedError) {
        const errorName = revertError.data?.errorName ?? '';
        if (errorName === 'SenderAddressResult') {
          if (revertError.data?.args?.length !== 1) {
            throw new Error(
              'Unexpected number of arguments in SenderAddressResult'
            );
          }

          const senderAddress = revertError.data.args[0] as Hex;

          if (senderAddress == zeroAddress) {
            throw new Error('Sender address is zero');
          }

          return senderAddress;
        }
      }
    }

    throw err;
  }
};

const testGetSenderAddress = async () => {
  const stealthSignerPubKey =
    '0x041f931394b5573213a3da152ebbdc03d701f561f3c6a04fc5355cb24ba2f58f3f14fb28b58e65817c4fea349306f508c470193f5f6464007bbec2872270a3de5d';

  const stealthSigner = publicKeyToAddress(stealthSignerPubKey);
  //  const stealthSigner = '0x3b5B2Ff6Db79ac722121596d1EFFA0AcafA98fd8';
  //  const stealthSigner = "0x4bb805ea867b17D75F0BAE9331CEef54f4257f9A";

  const initCode = getInitCode({ stealthSigner });

  const senderAddress = await getSenderAddressAsync({
    chainId: base.id,
    initCode,
  });

  const senderAddressSync = getSenderAddress({ stealthSigner });

  console.log(senderAddress, senderAddressSync);
};

testGetSenderAddress();
