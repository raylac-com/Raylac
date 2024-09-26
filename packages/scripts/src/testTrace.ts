import 'dotenv/config';
import {
  ENTRY_POINT_ADDRESS,
  RaylacAccountAbi,
  traceTransaction,
} from '@raylac/shared';
import { base } from 'viem/chains';
import { decodeFunctionData } from 'viem';

const testTrace = async () => {
  const txHash =
    '0x01c834033fd021c75937bd30f87bd4753348f99b921fdfbfd96b5baaa63be1be';

  const traces = await traceTransaction({
    txHash: txHash,
    chainId: base.id,
  });

  console.log(traces);

  const callsFromEntryPoint = traces // Get the `type: call` traces
    .filter(trace => trace.type === 'call')
    // Get the traces that are possibly function calls (i.e., the `input` field is not `0x`)
    .filter(trace => trace.action.input !== '0x')
    .filter(trace => trace.action.callType === 'call')
    .filter(trace => trace.action.from === ENTRY_POINT_ADDRESS.toLowerCase());

  for (const trace of callsFromEntryPoint) {
    try {
      const decoded = decodeFunctionData({
        abi: RaylacAccountAbi,
        data: trace.action.input,
      });
      if (decoded.functionName === 'execute') {
        console.log(trace);
        console.log(decoded);
      }
    } catch (err) {
      // Do nothing
    }
  }

  //  console.log(callsFromEntryPoint);
};

testTrace();
