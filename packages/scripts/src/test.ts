import { parseEther, toHex } from 'viem';
import { client } from './rpc';
import { arbitrum, base } from 'viem/chains';
import { hdKeyToAccount, mnemonicToAccount, signMessage } from 'viem/accounts';
import {
  getSenderAddressV2,
  getUserOpHash,
  getWalletClient,
  UserOperation,
} from '@raylac/shared';

const test = async () => {
  const account = mnemonicToAccount(
    'rain profit typical section elephant expire curious defy basic despair toy scene'
  );

  const hdKey = account.getHdKey();

  const spendingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  const singerAddress = spendingAccount.address;

  const sender = getSenderAddressV2({
    singerAddress,
  });

  const userOps = await client.buildSwapUserOp.query({
    singerAddress,
    origins: [
      {
        chainId: base.id,
        tokenAddress: '0x0000000000000000000000000000000000000000',
        amount: toHex(parseEther('0.00005')),
      },
    ],
    recipient: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    destinationChainId: arbitrum.id,
    destinationTokenAddress: '0x0000000000000000000000000000000000000000',
  });

  const signedUserOps: UserOperation[] = await Promise.all(
    userOps.map(async userOp => {
      const userOpHash = getUserOpHash({
        userOp,
      });

      if (userOp.sender !== sender) {
        throw new Error('Sender mismatch');
      }

      const sig = await spendingAccount.signMessage({
        message: {
          raw: userOpHash,
        },
      });

      return {
        ...userOp,
        signature: sig,
      };
    })
  );

  console.log(signedUserOps);

  const txReceipts = await client.submitUserOps.mutate(signedUserOps);

  console.log(txReceipts);
};

test();

/*
const rescue = async () => {
  const walletClient = getWalletClient({
    chainId: base.id,
  });

  const senderAddress = '0x3A4cC8eE5A71f15c3ac189bB5785f57758D79046';

  const account = mnemonicToAccount(
    'rain profit typical section elephant expire curious defy basic despair toy scene'
  );

  const hdKey = account.getHdKey();

  const spendingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  const tx = await walletClient.sendTransaction({
    account: spendingAccount,
    to: senderAddress,
    value: parseEther('0.000007'),
  });

  console.log(tx);
};
*/
