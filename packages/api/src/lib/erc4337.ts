import { ENTRY_POINT_ADDRESS, UserOperation } from '@sutori/shared';
import axios from 'axios';

const ALCHEMY_BASE_SEPOLIA_API_KEY = process.env.ALCHEMY_BASE_SEPOLIA_API_KEY;

export const sendUserOps = async (userOps: UserOperation[]) => {
  for (const userOp of userOps) {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendUserOperation',
        params: [userOp, ENTRY_POINT_ADDRESS],
      }),
    };

    try {
      const result = await axios.post(
        `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_BASE_SEPOLIA_API_KEY}`,
        {},
        options
      );
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  }
};
