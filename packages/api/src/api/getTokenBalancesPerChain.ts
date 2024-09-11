import supportedTokens from '@raylac/shared/out/supportedTokens';
import getStealthAccounts from './getStealthAccounts';
import { getTokenBalance } from '@/lib/erc20';
import { Chain, createPublicClient, Hex, http } from 'viem';
import {
  getAlchemyRpcUrl,
  NATIVE_TOKEN_ADDRESS,
  TokenBalance,
} from '@raylac/shared';

/**
 * Get the ETH balance of an address on the given chain
 */
const getETHBalance = async ({
  address,
  chain,
}: {
  address: Hex;
  chain: Chain;
}) => {
  console.log('getETHBalance', address, chain.id);
  const publicClient = createPublicClient({
    transport: http(getAlchemyRpcUrl({ chain })),
    chain,
  });
  return await publicClient.getBalance({ address });
};

/**
 * Get the balances of tokens for all chains and supported tokens
 * for a user
 */
const getTokenBalancesPerChain = async ({ userId }: { userId: number }) => {
  const stealthAddresses = await getStealthAccounts({ userId });

  const allTokenBalances: TokenBalance[] = [];

  for (const stealthAddress of stealthAddresses) {
    for (const token of supportedTokens) {
      // Get token balances across all supported chains
      const tokenBalances = await Promise.all(
        token.addresses.map(async tokenAddress => {
          const balance =
            tokenAddress.address === NATIVE_TOKEN_ADDRESS
              ? await getETHBalance({
                  address: stealthAddress.address as Hex,
                  chain: tokenAddress.chain,
                })
              : await getTokenBalance({
                  contractAddress: tokenAddress.address,
                  chain: tokenAddress.chain,
                  address: stealthAddress.address as Hex,
                });

          return {
            tokenId: token.tokenId,
            tokenAddress: tokenAddress.address,
            stealthAddress: {
              address: stealthAddress.address as Hex,
              ephemeralPubKey: stealthAddress.ephemeralPubKey as Hex,
              viewTag: stealthAddress.viewTag as Hex,
              stealthPubKey: stealthAddress.stealthPubKey as Hex,
            },
            balance,
            chain: tokenAddress.chain,
          } as TokenBalance;
        })
      );

      allTokenBalances.push(...tokenBalances);
    }
  }

  return allTokenBalances;
};

export default getTokenBalancesPerChain;
