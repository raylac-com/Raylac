import { parseEther, toHex } from 'viem';
import { client } from './rpc';
import { arbitrum, base, zora } from 'viem/chains';
import { hdKeyToAccount, mnemonicToAccount, signMessage } from 'viem/accounts';
import {
  getSenderAddressV2,
  getUserOpHash,
  getWalletClient,
  UserOperation,
} from '@raylac/shared';

const testSwap = async () => {
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

  const quote = await client.getSwapQuote.mutate({
    input: [
      {
        chainId: base.id,
        tokenAddress: '0x0000000000000000000000000000000000000000',
        amount: toHex(parseEther('0.00005')),
      },
      {
        chainId: zora.id,
        tokenAddress: '0x0000000000000000000000000000000000000000',
        amount: toHex(parseEther('0.00005')),
      },
    ],
  });

  const userOps = await client.buildSwapUserOp.mutate({
    singerAddress,
    quote,
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

testSwap();
