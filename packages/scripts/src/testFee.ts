import 'dotenv/config';
import { Alchemy, Network } from 'alchemy-sdk';
import { getPublicClient } from '@raylac/shared';
import { baseSepolia } from 'viem/chains';

const testFee = async () => {
  // Optional config object, but defaults to the API key 'demo' and Network 'eth-mainnet'.
  const settings = {
    apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API key.
    network: Network.BASE_SEPOLIA, // Replace with your network.
  };

  const alchemy = new Alchemy(settings);

  const feeData = await alchemy.core.getFeeData();

  console.log(
    'baseFeePerGas',
    feeData.lastBaseFeePerGas?.toBigInt().toLocaleString()
  );
  console.log(
    'maxFeePerGas',
    feeData.maxFeePerGas?.toBigInt().toLocaleString()
  );
  console.log(
    'maxPriorityFee',
    feeData.maxPriorityFeePerGas?.toBigInt().toLocaleString()
  );

  const currentMaxPriorityFee = '0x6b49d200';
  const currentMaxFee = '0x6b49d200';

  console.log(
    'currentMaxPriorityFee',
    BigInt(currentMaxPriorityFee).toLocaleString()
  );
  console.log('currentMaxFee', BigInt(currentMaxFee).toLocaleString());

  const client = getPublicClient({
    chainId: baseSepolia.id,
  });

  const block = await client.getBlock({
    blockTag: 'latest',
  });

  for (const txHash of block.transactions) {
    const tx = await client.getTransaction({
        hash: txHash,
    });

    console.log(tx.maxFeePerGas, tx.maxPriorityFeePerGas?.toLocaleString());
  }
};

testFee();
