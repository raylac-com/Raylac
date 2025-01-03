import { privateKeyToAccount } from 'viem/accounts';
import { formatUnits, Hex, parseUnits } from 'viem';
import { arbitrum, base, mainnet, optimism } from 'viem/chains';
import { getPublicClient } from '@raylac/shared';

const estimateGas = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );

  const publicClient = getPublicClient({
    chainId: mainnet.id,
  });

  const transferGas = await publicClient.estimateGas({
    to: account.address,
    value: parseUnits('0.1', 18),
  });

  const blobFee = await publicClient.getBlobBaseFee();

  console.log(transferGas);
  console.log(formatUnits(blobFee, 18));
};

estimateGas();
