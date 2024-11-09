import { webcrypto } from 'node:crypto';
import {
  ERC20Abi,
  generateStealthAddressV2,
  getDevChainRpcUrl,
  getPublicClient,
  getSpendingPrivKey,
  getTokenAddressOnChain,
  getViewingPrivKey,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  signUserOpWithStealthAccount,
  sleep,
  StealthAddressWithEphemeral,
  supportedTokens,
  toCoingeckoTokenId,
  UserActionType,
  UserOperation,
} from '@raylac/shared';
import { createTestClient, Hex, http, parseUnits, toHex } from 'viem';
import { anvil } from 'viem/chains';
import { client, getAuthedClient, getTestUserId } from './rpc';
import { TEST_ACCOUNT_MNEMONIC } from './auth';
import { encodePaymasterAndData } from '@raylac/shared/src/utils';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

export const getTestClient = ({ chainId }: { chainId: number }) => {
  const rpcUrl = getDevChainRpcUrl({ chainId });

  return createTestClient({
    mode: 'anvil',
    chain: anvil,
    transport: http(rpcUrl),
  });
};

/**
 * Get the current USD price of a token
 */
export const getTokenPrice = async (tokenId: string) => {
  if (tokenId === 'usdc') {
    return { usd: 1 };
  }

  const tokenPrices = await client.getTokenPrices.query();
  const price = tokenPrices[toCoingeckoTokenId(tokenId)];

  if (price === undefined) {
    throw new Error(`Token price not found for ${tokenId}`);
  }

  return price;
};

const getNativeBalance = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });
  return await client.getBalance({ address });
};

const getERC20Balance = async ({
  address,
  tokenAddress,
  chainId,
}: {
  address: Hex;
  tokenAddress: Hex;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });

  const balance = await client.readContract({
    address: tokenAddress,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return balance;
};

export const getAddressBalance = async ({
  tokenId,
  address,
  chainId,
}: {
  tokenId: string;
  address: Hex;
  chainId: number;
}) => {
  if (tokenId === 'eth') {
    return getNativeBalance({ address, chainId });
  } else {
    const tokenAddress = getTokenAddressOnChain({ chainId, tokenId });
    return await getERC20Balance({ address, tokenAddress, chainId });
  }
};

/**
 * Get the `User` object for the test user
 */
export const getTestUser = async () => {
  const testUserId = await getTestUserId();
  const user = await client.getUser.query({ userId: testUserId });

  if (!user) {
    throw new Error(`Test user ${testUserId} not found`);
  }

  return user;
};

/**
 * Create a stealth address for the test user
 * - Submits the stealth address to the server which will announce it to the ERC5564 contract on anvil
 */
export const createStealthAccountForTestUser = async ({
  useAnvil,
}: {
  useAnvil: boolean;
}): Promise<StealthAddressWithEphemeral> => {
  const user = await getTestUser();

  // Generate a new stealth address for the test user
  const newStealthAccount = generateStealthAddressV2({
    spendingPubKey: user.spendingPubKey as Hex,
    viewingPubKey: user.viewingPubKey as Hex,
  });

  const authedClient = await getAuthedClient();

  // Submit the stealth address to the server
  await authedClient.addStealthAccount.mutate({
    address: newStealthAccount.address,
    signerAddress: newStealthAccount.signerAddress,
    ephemeralPubKey: newStealthAccount.ephemeralPubKey,
    viewTag: newStealthAccount.viewTag,
    userId: user.id,
    label: '',
    useAnvil,
  });

  return newStealthAccount;
};

/**
 * Sign a user operation with the paymaster account
 * This function calls the paymaster signUserOp endpoint to get the paymaster signature,
 * and sets the `paymasterAndData` field on the user operation
 */
export const signUserOpWithPaymasterAccount = async ({
  userOp,
}: {
  userOp: UserOperation;
}) => {
  const authedClient = await getAuthedClient();
  const paymasterSignedUserOp = await authedClient.paymasterSignUserOp.mutate({
    userOp,
  });

  const paymasterAndData = encodePaymasterAndData({
    paymaster: RAYLAC_PAYMASTER_V2_ADDRESS,
    data: paymasterSignedUserOp,
  });
  userOp.paymasterAndData = paymasterAndData;

  return userOp;
};

/**
 * Sign a user operation with the test user's stealth account
 */
export const signUserOpWithTestUserAccount = async ({
  userOp,
  stealthAccount,
}: {
  userOp: UserOperation;
  stealthAccount: StealthAddressWithEphemeral;
}) => {
  const spendingPrivKey = getSpendingPrivKey(TEST_ACCOUNT_MNEMONIC);
  const viewingPrivKey = getViewingPrivKey(TEST_ACCOUNT_MNEMONIC);

  // Sign the user operation with the stealth account
  const signedUserOp = await signUserOpWithStealthAccount({
    userOp,
    stealthAccount,
    spendingPrivKey,
    viewingPrivKey,
  });

  return signedUserOp;
};

/**
 * Get the amount of tokens from the USD amount
 */
export const fromUsdAmount = async ({
  tokenId,
  tokenPriceUsd,
}: {
  tokenId: string;
  tokenPriceUsd: number;
}) => {
  const tokenMeta = supportedTokens.find(token => token.tokenId === tokenId);

  if (!tokenMeta) {
    throw new Error(`Token metadata not found for ${tokenId}`);
  }

  const tokenPrice = await getTokenPrice(tokenId);

  const amountFormatted = (tokenPriceUsd / tokenPrice.usd).toString();

  const amount = parseUnits(amountFormatted, tokenMeta.decimals);

  return amount;
};

/**
 * Get the token balance of the test user across all chains and stealth addresses
 */
export const getTestUserTokenBalance = async ({
  tokenId,
}: {
  tokenId: string;
}) => {
  const authedClient = await getAuthedClient();
  const senderTokenBalances = await authedClient.getTokenBalances.query();

  const senderBalance = senderTokenBalances.find(
    balance => balance.tokenId === tokenId
  )?.balance;

  if (!senderBalance) {
    throw new Error(`Sender does not have ${tokenId} balance`);
  }

  return BigInt(senderBalance);
};

export const waitFor = async ({
  fn,
  timeout,
  interval = 1000,
  label,
}: {
  fn: () => Promise<boolean>;
  timeout: number;
  interval?: number;
  label: string;
}) => {
  const timeoutMs = Date.now() + timeout;

  while (true) {
    if (await fn()) return;
    if (Date.now() > timeoutMs) throw new Error(`Timeout waiting for ${label}`);
    await sleep(interval);
  }
};

export const getUserActionTag = ({
  groupTag,
  groupSize,
  userActionType,
}: {
  groupTag: Hex;
  groupSize: number;
  userActionType: UserActionType;
}) => {
  if (groupSize < 1 || groupSize > 255) {
    throw new Error('Group size must be between 1 and 255');
  }

  if (groupTag.replace('0x', '').length !== 64) {
    throw new Error('Group tag must be 32 bytes');
  }

  const groupSizeHex = toHex(groupSize, { size: 2 }).replace('0x', '');
  const userActionTypeHex = userActionType.replace('0x', '');

  const tag = `${groupTag}${groupSizeHex}${userActionTypeHex}` as Hex;

  return tag;
};
