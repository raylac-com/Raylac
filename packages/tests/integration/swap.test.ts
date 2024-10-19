import 'dotenv/config';
import {
  chooseInputAddresses,
  encodePaymasterAndData,
  getGasInfo,
  getSpendingPrivKey,
  getViewingPrivKey,
  RAYLAC_PAYMASTER_ADDRESS,
  recoveryStealthPrivKey,
  StealthAddressWithEphemeral,
  signUserOpWithStealthAccount,
  buildUserOp,
  getPublicClient,
  RaylacAccountAbi,
} from '@raylac/shared';
import { hashTypedData, Hex, parseUnits } from 'viem';
import { getAuthedClient } from '../lib/rpc';
import { beforeAll, describe, test } from 'vitest';
import { MNEMONIC, signInAsTestUser } from '../lib/auth';
import { base } from 'viem/chains';
import { concat } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { numberToHex } from 'viem';
import { size } from 'viem';
import supportedTokens from '@raylac/shared/out/supportedTokens';

// const DEGEN_CONTRACT = '0x4ed4e862860bed51a9570b96d89af5e1b0efefed';
const WETH_CONTRACT = '0x4200000000000000000000000000000000000006';

const verifySig = async ({
  signature,
  hash,
  address,
}: {
  signature: Hex;
  hash: Hex;
  address: Hex;
}) => {
  const client = getPublicClient({ chainId: base.id });

  const result = await client.readContract({
    abi: RaylacAccountAbi,
    address,
    functionName: 'isValidSignature',
    args: [hash, signature],
  });

  return result === '0x1626ba7e';
};

describe('swap', () => {
  let token: string;

  beforeAll(async () => {
    const { token: _token } = await signInAsTestUser();

    token = _token;
  });

  test('should return the swap price', async () => {
    const spendingPrivKey = getSpendingPrivKey(MNEMONIC);
    const viewingPrivKey = getViewingPrivKey(MNEMONIC);

    const authedClient = getAuthedClient(token);

    const amount = parseUnits('1', 6);
    const taker = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';

    const usdcContract = supportedTokens
      .find(token => token.tokenId === 'usdc')
      ?.addresses.find(address => address.chain.id === base.id)?.address;

    if (!usdcContract) {
      throw new Error('USDC contract not found');
    }

    const addressTokenBalances =
      await authedClient.getAddressBalancesPerChain.query();

    const stealthAccounts = await authedClient.getStealthAccounts.query();

    const gasInfo = await getGasInfo({
      isDevMode: false,
    });

    const addressNonces = await authedClient.getAddressNonces.query();

    const inputs = chooseInputAddresses({
      chainId: base.id,
      tokenId: 'usdc',
      amount: BigInt(amount),
      addressTokenBalances,
    });

    for (const input of inputs) {
      const quote = await authedClient.getSwapQuote.query({
        chainId: base.id,
        sellToken: usdcContract,
        sellAmount: amount.toString(),
        buyToken: WETH_CONTRACT,
        taker,
      });

      const stealthAddress = stealthAccounts.find(
        stealthAccount => stealthAccount.address === input.address
      );

      if (!stealthAddress) {
        throw new Error('Stealth address not found');
      }

      const privKey = recoveryStealthPrivKey({
        ephemeralPubKey: stealthAddress.ephemeralPubKey as Hex,
        viewingPrivKey,
        spendingPrivKey,
      });

      /*
      const permit2ApproveUserOp = buildApprovePermit2UserOp({
        tokenAddress: usdcContract,
        signerAddress: stealthAddress.signerAddress as Hex,
        gasInfo,
        nonce: addressNonces[stealthAddress.address] ?? null,
        chainId: base.id,
      });

      const paymasterAndData = encodePaymasterAndData({
        paymaster: RAYLAC_PAYMASTER_ADDRESS,
        data: await authedClient.paymasterSignUserOp.mutate({
          userOp: permit2ApproveUserOp,
        }),
      });
      permit2ApproveUserOp.paymasterAndData = paymasterAndData;

      // Sign the user operation with the stealth account
      const signedUserOp = await signUserOpWithStealthAccount({
        userOp: permit2ApproveUserOp,
        stealthAccount: stealthAddress as StealthAddressWithEphemeral,
        spendingPrivKey,
        viewingPrivKey,
      });

      await authedClient.submitUserOp.mutate({
        userOp: signedUserOp,
      });
      */

      const signerAccount = privateKeyToAccount(privKey);

      const signature = await signerAccount.signTypedData(
        quote.permit2.eip712 as any
      );

      const isValid = await verifySig({
        signature,
        hash: hashTypedData(quote.permit2.eip712 as any) as Hex,
        address: stealthAddress.address as Hex,
      });

      if (!isValid) {
        throw new Error('Signature is invalid');
      }

      const signatureLengthInHex = numberToHex(size(signature), {
        signed: false,
        size: 32,
      });

      const transaction = quote.transaction;

      transaction.data = concat([
        transaction.data,
        signatureLengthInHex,
        signature,
      ]);

      const swapUserOp = buildUserOp({
        client: getPublicClient({ chainId: base.id }),
        stealthSigner: stealthAddress.signerAddress as Hex,
        to: transaction.to,
        value: 0n,
        data: transaction.data,
        tag: '0x',
        gasInfo,
        nonce: addressNonces[stealthAddress.address] ?? null,
      });

      const paymasterAndData = encodePaymasterAndData({
        paymaster: RAYLAC_PAYMASTER_ADDRESS,
        data: await authedClient.paymasterSignUserOp.mutate({
          userOp: swapUserOp,
        }),
      });
      swapUserOp.paymasterAndData = paymasterAndData;

      // Sign the user operation with the stealth account
      const signedUserOp = await signUserOpWithStealthAccount({
        userOp: swapUserOp,
        stealthAccount: stealthAddress as StealthAddressWithEphemeral,
        spendingPrivKey,
        viewingPrivKey,
      });

      await authedClient.submitUserOp.mutate({
        userOp: signedUserOp,
      });
    }
  });
});
