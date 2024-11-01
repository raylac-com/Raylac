import 'dotenv/config';
import {
  ENTRY_POINT_ADDRESS,
  RaylacAccountAbi,
  traceTransaction,
} from '@raylac/shared';
import { base } from 'viem/chains';
import { decodeFunctionData, getAddress } from 'viem';

const testTrace = async () => {
  const txHash =
    '0x469dc44ce9699badeebe0214cd78af253bcb8ca622980860390236590aa9a8e6';

  const traces = await traceTransaction({
    txHash: txHash,
    chainId: base.id,
  });

  console.log(
    traces
      .filter(trace => trace.type === 'call')
      .filter(trace => trace.action.callType === 'call')
      .filter(trace => trace.action.input === '0x')
      .map(trace => ({
        from: getAddress(trace.action.from),
        to: getAddress(trace.action.to),
        value: trace.action.value,
      }))
  );

  //  console.log(callsFromEntryPoint);
};

testTrace();
