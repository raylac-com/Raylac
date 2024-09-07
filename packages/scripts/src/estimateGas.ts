import "dotenv/config";
import { AccountFactoryAbi, ACCOUNT_FACTORY_ADDRESS } from '@raylac/shared';
import { publicClient } from './viem';
import { encodeFunctionData } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const estimateGas = async () => {
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
