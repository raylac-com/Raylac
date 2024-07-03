import { ERC20Abi, SutoriAccountAbi, UserOperation } from '@sutori/shared';
import { decodeFunctionData } from 'viem';

export const JWT_PRIV_KEY = process.env.JWT_PRIV_KEY as string;

if (!JWT_PRIV_KEY) {
  throw new Error('JWT_PRIV_KEY is required');
}

/**
 * Get ERC20 token transfer data from a user operation
 */
export const getTransferDataFromUserOp = (userOp: UserOperation) => {
  const { functionName, args } = decodeFunctionData({
    abi: SutoriAccountAbi,
    data: userOp.callData,
  });

  if (functionName !== 'execute') {
    throw new Error("Function name must be 'execute'");
  }

  const transferData = decodeFunctionData({
    abi: ERC20Abi,
    data: args[2],
  });

  const [to, amount] = transferData.args;
  return {
    to: to as string,
    amount: amount as bigint
  };
};
