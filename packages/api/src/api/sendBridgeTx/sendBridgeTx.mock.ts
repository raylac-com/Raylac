import { SendBridgeTxRequestBody } from '@raylac/shared';
import { Hex } from 'viem';

const sendBridgeTxMock = async (
  _arg: SendBridgeTxRequestBody
): Promise<Hex> => {
  // Return a mock transaction hash
  return '0x1234567890123456789012345678901234567890123456789012345678901234' as Hex;
};

export default sendBridgeTxMock;
