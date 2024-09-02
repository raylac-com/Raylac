import {
  ERC20Abi,
  USDC_CONTRACT_ADDRESS,
  generateStealthAddress,
  getStealthAddress,
} from '@sutori/shared';
import { publicClient, walletClient } from '../lib/viem';
import { Hex, parseUnits } from 'viem';
import { privateKeyToAccount, publicKeyToAddress } from 'viem/accounts';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { JWT_PRIV_KEY } from '../utils';
import { handleNewStealthAccount } from '../lib/stealthAccount';

const SIGNUP_BONUS_PAYER_PRIV_KEY = process.env.SIGNUP_BONUS_PAYER_PRIV_KEY;

if (!SIGNUP_BONUS_PAYER_PRIV_KEY) {
  throw new Error('Missing SIGNUP_BONUS_PAYER_PRIV_KEY');
}

const SIGN_UP_BONUS_PAYER_ACCOUNT = privateKeyToAccount(
  SIGNUP_BONUS_PAYER_PRIV_KEY as Hex
);

const BONUS_AMOUNT = parseUnits('1', 6);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendSignUpBonus = async ({ to }: { to: Hex }) => {
  await walletClient.writeContract({
    abi: ERC20Abi,
    address: USDC_CONTRACT_ADDRESS,
    functionName: 'transfer',
    args: [to as Hex, BONUS_AMOUNT],
    account: SIGN_UP_BONUS_PAYER_ACCOUNT,
  });
};

/**
 * Sign up a new user.
 * - Save the user to the database
 * - Mark the invite code as used
 * - Send a sign-up bonus to the user
 * @returns The `user` object and a JWT token
 */
const signUp = async ({
  viewingPrivKey,
  inviteCode,
  spendingPubKey,
  name,
  username,
}: {
  viewingPrivKey: Hex;
  inviteCode: string;
  spendingPubKey: Hex;
  name: string;
  username: string;
}) => {
  const viewingAccount = privateKeyToAccount(viewingPrivKey as Hex);

  // TODO: Check username validity

  /*
  const inviteCodeExists = await prisma.inviteCode.findFirst({
    where: {
      inviteCode,
      isUsed: false,
    },
  });

  if (!inviteCodeExists) {
    throw new Error('Invalid invite code');
  }
    */

  const user = await prisma.user.create({
    data: {
      name: name,
      username: username,
      spendingPubKey: spendingPubKey,
      viewingPubKey: viewingAccount.publicKey,
      viewingPrivKey: viewingPrivKey,
    },
  });

  const sendSignUpBonusTo = await generateStealthAddress({
    spendingPubKey: spendingPubKey,
    viewingPubKey: viewingAccount.publicKey,
  });

  const sendSignUpBonusToAddress = await getStealthAddress({
    client: publicClient,
    stealthSigner: publicKeyToAddress(sendSignUpBonusTo.stealthPubKey),
  });

  if (!sendSignUpBonusToAddress) {
    throw new Error('Failed to generate stealth address');
  }

  await handleNewStealthAccount({
    userId: user.id,
    stealthAccount: {
      address: sendSignUpBonusToAddress,
      stealthPubKey: sendSignUpBonusTo.stealthPubKey,
      viewTag: sendSignUpBonusTo.viewTag,
      ephemeralPubKey: sendSignUpBonusTo.ephemeralPubKey,
    },
  });

  /*
  await sendSignUpBonus({
    to: sendSignUpBonusToAddress,
  });
  */

  const token = jwt.sign({ userId: user.id }, JWT_PRIV_KEY);

  return {
    user,
    token,
  };
};

export default signUp;
