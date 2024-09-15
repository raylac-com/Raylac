import 'dotenv/config';
import {
  AccountFactoryAbi,
  ACCOUNT_FACTORY_ADDRESS,
  getPublicClient,
} from '@raylac/shared';
import { encodeFunctionData } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const estimateGas = async () => {
  const chainId = baseSepolia.id;

  const publicClient = getPublicClient({
    chainId,
  });

  const privKey = generatePrivateKey();
  const stealthAccount = privateKeyToAccount(privKey);

  const data = encodeFunctionData({
    abi: AccountFactoryAbi,
    functionName: 'createAccount',
    args: [stealthAccount.address],
  });

  const gas = await publicClient.estimateGas({
    data,
    account: stealthAccount.address,
    to: ACCOUNT_FACTORY_ADDRESS,
  });

  console.log(gas);
};

estimateGas();
