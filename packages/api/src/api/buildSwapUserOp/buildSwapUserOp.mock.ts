import { BuildSwapUserOpRequestBody } from '@raylac/shared/out/rpcTypes';
import { UserOperation } from '@raylac/shared';
import { getSenderAddressV2 } from '@raylac/shared/out/utils';

const buildSwapUserOpMock = async ({
  singerAddress,
  quote: _quote,
}: BuildSwapUserOpRequestBody): Promise<UserOperation[]> => {
  // Get quote from Relay
  const senderAddress = getSenderAddressV2({
    singerAddress,
  });

  const userOp: UserOperation = {
    sender: senderAddress,
    nonce: '0x0',
    initCode: '0x0',
    callData: '0x0',
    callGasLimit: '0x0',
    verificationGasLimit: '0x0',
    preVerificationGas: '0x0',
    maxFeePerGas: '0x0',
    maxPriorityFeePerGas: '0x0',
    paymasterAndData: '0x0',
    signature: '0x0',
    chainId: 1,
  };

  return [userOp];
};

export default buildSwapUserOpMock;
