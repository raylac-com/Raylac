import { webcrypto } from 'node:crypto';
import {
  ERC20Abi,
  generateStealthAddressV2,
  getPublicClient,
  getTokenAddressOnChain,
  getWalletClient,
  StealthAddressWithEphemeral,
  supportedTokens,
  toCoingeckoTokenId,
} from '@raylac/shared';
import { createTestClient, Hex, http, parseUnits } from 'viem';
import { anvil } from 'viem/chains';
import { client, getAuthedClient, getTestUserId } from './rpc';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

export const getTestClient = () => {
  const ANVIL_RPC_URL = process.env.ANVIL_RPC_URL;

  if (!ANVIL_RPC_URL) {
    throw new Error('ANVIL_RPC_URL is not set');
  }

  return createTestClient({
    mode: 'anvil',
    chain: anvil,
    transport: http(ANVIL_RPC_URL),
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
 * Fund an address with a given amount of ETH.
 * This only works on anvil (obviously)
 */
export const fundAddress = async ({
  address,
  amount,
}: {
  address: Hex;
  amount: bigint;
}) => {
  const testClient = getTestClient();
  await testClient.setBalance({ address, value: amount });
};

/**
 * Impersonate an address and send the given amount of ETH to the given address
 */
export const impersonateAndSend = async ({
  from,
  to,
  amount,
}: {
  from: Hex;
  to: Hex;
  amount: bigint;
}): Promise<Hex> => {
  const testClient = getTestClient();
  await testClient.impersonateAccount({ address: from });
  const walletClient = getWalletClient({ chainId: anvil.id });

  return await walletClient.sendTransaction({
    account: from,
    to,
    value: amount,
  });
};

export const createStealthAccountForTestUser =
  async (): Promise<StealthAddressWithEphemeral> => {
    const user = await client.getUser.query({ userId: await getTestUserId() });

    if (!user) {
      throw new Error('User not found');
    }

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
    });

    return newStealthAccount;
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
