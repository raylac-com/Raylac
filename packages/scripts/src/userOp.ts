import { Hex, encodeFunctionData, parseUnits } from 'viem';
import publicClient from './client';
import {
  ENTRY_POINT_ADDRESS,
  ERC20Abi,
  EntryPointAbi,
  SutoriAccountAbi,
  buildUserOp,
  recoveryStealthPrivKey,
} from '@sutori/shared';
import { estimateUserOpGas, getUserOpByHash, sendUserOps } from './bundler';
import { privateKeyToAccount } from 'viem/accounts';
import { handleOps } from './entryPoint';

const BASE_USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const stealthPubKey =
  '0x02cca173dddcb5c617650e1e3a2525f3198fb117d2d4586b495b8292cbce9c7490';

const ephemeralPubKey =
  '0x038bf2062510be32d04ac757e46975336cf9f08d282ef7a1915d50d13511c58b3b';
const spendingPrivKey =
  '0xc1a2c18bfa05971b7cd26df2bcf92433bac5f6bbe263345336b5f5f077d5b520';
const viewingPrivKey =
  '0x0144e03e0ea653b83ccfa9181f42775b285624b0c7e7d9d2c019d0aaef68d40a';

const userOp = async () => {
  const to = BASE_USDC_CONTRACT;
  const value = BigInt(0);

  const transferTo = '0x94f149b27065aa60ef053788f6B8A60C53C001D4';
  const transferAmount = parseUnits('3', 6);

  const data = encodeFunctionData({
    abi: ERC20Abi,
    functionName: 'transfer',
    args: [transferTo, transferAmount],
  });

  const stealthPrivKey = recoveryStealthPrivKey({
    ephemeralPubKey,
    spendingPrivKey,
    viewingPrivKey,
  });

  const recoveredStealthPubKey = privateKeyToAccount(stealthPrivKey);

  const userOp = await buildUserOp({
    client: publicClient,
    stealthPubKey,
    to,
    value,
    data,
  });

  console.log(userOp);

  /*
  await handleOps({
    beneficiary: '0x94f149b27065aa60ef053788f6B8A60C53C001D4',
    ops: [userOp],
  });
  */
//  await sendUserOps([userOp]);
const userOpHash = "0x217238cbf1048ce093a97fe17543d35a67fcaeb6563b472dd09c0ffdea23e850"

  const op = await getUserOpByHash(userOpHash);
  console.log('Op', op);
  //  const gas = await estimateUserOpGas(userOp);
  //  console.log('Gas', gas);
};

userOp();
