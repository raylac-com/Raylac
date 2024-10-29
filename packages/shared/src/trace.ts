import axios from 'axios';
import { Hex, toHex } from 'viem';
import { BlockTraceResponse, TraceResponseData } from './types';
import { getQuickNodeRpcUrl } from './ethRpc';
import { getChainFromId } from './utils';

/**
 * Calls the `trace_filter` RPC method
 */
export const traceFilter = async ({
  toAddress,
  fromAddress,
  fromBlock,
  toBlock,
  chainId,
}: {
  toAddress?: Hex[];
  fromAddress?: Hex[];
  fromBlock: Hex;
  toBlock: Hex;
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
          toBlock,
          fromAddress,
          toAddress,
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

export const traceBlockByNumber = async ({
  blockNumber,
  chainId,
}: {
  blockNumber: bigint;
  chainId: number;
}) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post<{
    result: BlockTraceResponse;
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
      method: 'debug_traceBlockByNumber',
      params: [
        toHex(blockNumber),
        {
          tracer: 'callTracer',
          tracerConfig: {
            onlyTopCall: false,
          },
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

export const traceBlockByHash = async ({
  blockHash,
  chainId,
}: {
  blockHash: Hex;
  chainId: number;
}) => {
  const config = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  const result = await axios.post<{
    result: BlockTraceResponse;
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
      method: 'debug_traceBlockByHash',
      params: [
        blockHash,
        {
          tracer: 'callTracer',
          tracerConfig: {
            onlyTopCall: false,
          },
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

  if (result.data.error) {
    throw new Error(result.data.error.message);
  }

  return result.data.result;
};
