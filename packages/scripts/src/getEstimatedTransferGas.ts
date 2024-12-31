import {
  ETH,
  GetEstimatedTransferGasRequestBody,
  getGasInfo,
  USDC,
} from '@raylac/shared';
import { client } from './rpc';
import { parseEther, parseUnits } from 'viem';
import { base } from 'viem/chains';

const getEstimatedTransferGas = async () => {
  const chainId = base.id;
  const gasInfo = (await getGasInfo({ chainIds: [chainId] }))[0];

  const maxFeePerGas = gasInfo.baseFeePerGas + gasInfo.maxPriorityFeePerGas;

  const requestEth: GetEstimatedTransferGasRequestBody = {
    chainId,
    token: ETH,
    amount: parseEther('0.0001').toString(),
    to: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    maxFeePerGas: maxFeePerGas.toString(),
    from: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
  };

  const resultEth = await client.getEstimatedTransferGas.mutate(requestEth);
  console.log(resultEth);

  /*
  const requestUsdc: GetEstimatedTransferGasRequestBody = {
    chainId,
    token: USDC,
    amount: parseUnits('0.01', 6).toString(),
    to: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    maxFeePerGas: maxFeePerGas.toString(),
    from: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
  };

  const resultUsdc = await client.getEstimatedTransferGas.mutate(requestUsdc);
  console.log(resultUsdc);
  */
};

getEstimatedTransferGas();
