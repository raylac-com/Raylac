import { base } from 'viem/chains';

import {
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  getInitCode,
  getPublicClient,
  getSenderAddressV2,
} from '@raylac/shared';
import {
  BaseError,
  ContractFunctionRevertedError,
  Hex,
  zeroAddress,
} from 'viem';
const getSenderAddress = async () => {
  const stealthSigner = '0x9d4Bc8f7Ac421e0F1EB6c26A125cc7d17445a442';

  const address = getSenderAddressV2({
    stealthSigner,
  });

  console.log(address);

  const client = getPublicClient({ chainId: base.id });

  const initCode = getInitCode({
    stealthSigner,
  });

  try {
    const result = await client.simulateContract({
      abi: EntryPointAbi,
      address: ENTRY_POINT_ADDRESS,
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
          console.log({ senderAddress });

          return senderAddress;
        }
      }
    }
  }
};

getSenderAddress();
