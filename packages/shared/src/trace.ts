import axios from 'axios';
import { Hex } from 'viem';
import { TraceResponseData } from './types';
import { getQuickNodeRpcUrl } from './ethRpc';
import { getChainFromId } from './utils';

/**
 * Calls the `trace_filter` RPC method
 */
export const traceFilter = async ({
  toAddress,
  fromBlock,
  chainId,
}: {
  toAddress: Hex;
  fromBlock: Hex;
  chainId: number;
}) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post<{
    result: TraceResponseData[];
    error?: {
      code: number;
      message: string;
    };
  }>(
    getQuickNodeRpcUrl({
      chain: getChainFromId(chainId),
    }),
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'trace_filter',
      params: [
        {
          fromBlock,
          toAddress: [toAddress],
        },
      ],
    },
    config
  );

  if (result.data.error) {
    throw new Error(result.data.error.message);
  }

  return result.data.result;
};

/**
 * Calls the `trace_transaction` RPC method
 */
export const traceTransaction = async ({
  txHash,
  chainId,
}: {
  txHash: Hex;
  chainId: number;
}) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  console.time(`trace_transaction ${txHash}`);
  const result = await axios.post<{
    result: TraceResponseData[];
    error?: {
      code: number;
      message: string;
    };
  }>(
    getQuickNodeRpcUrl({
      chain: getChainFromId(chainId),
    }),
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'trace_transaction',
      params: [txHash],
    },
    config
  );
  console.timeEnd(`trace_transaction ${txHash}`);

  if (result.data.error) {
    throw new Error(result.data.error.message);
  }

  return result.data.result;
};
