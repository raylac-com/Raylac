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
    '0x8d478251100e8ee3a2fd094d453a903409ab81c5abc1d2265a96deb1dcf53f04';

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
