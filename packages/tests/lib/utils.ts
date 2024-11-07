import { webcrypto } from 'node:crypto';
import {
  ERC20Abi,
  getPublicClient,
  getTokenAddressOnChain,
  getWalletClient,
} from '@raylac/shared';
import { createTestClient, Hex, http } from 'viem';
import { anvil } from 'viem/chains';

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
}) => {
  const testClient = getTestClient();
  await testClient.impersonateAccount({ address: from });
  const walletClient = getWalletClient({ chainId: anvil.id });

  await walletClient.sendTransaction({
    account: from,
    to,
    value: amount,
  });
};
