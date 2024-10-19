import { encodeFunctionData, Hex, maxUint256 } from 'viem';
import { PERMIT2_ADDRESS } from './addresses';
import ERC20Abi from './abi/ERC20Abi';
import { ChainGasInfo, UserOperation } from './types';
import { buildUserOp } from './erc4337';
import { getPublicClient } from './ethRpc';

/**
 * Build a user operation to approve the Permit2 contract to spend a token
 */
export const buildApprovePermit2UserOp = ({
  tokenAddress,
  signerAddress,
  gasInfo,
  chainId,
  nonce,
}: {
  tokenAddress: Hex;
  signerAddress: Hex;
  gasInfo: ChainGasInfo[];
  nonce: number | null;
  chainId: number;
}): UserOperation => {
  const data = encodeFunctionData({
    abi: ERC20Abi,
    functionName: 'approve',
    args: [PERMIT2_ADDRESS, maxUint256],
  });

  const client = getPublicClient({ chainId });

  const userOp = buildUserOp({
    client,
    stealthSigner: signerAddress,
    to: tokenAddress,
    value: 0n,
    data,
    tag: '0x',
    gasInfo,
    nonce,
  });

  return userOp;
};

/*
export const buildSwapUserOps = ({
  zeroExQuotes,
  addressTokenBalances,
  chainId,
  stealthAddresses,
  addressNonces,
  gasInfo,
}: {
  zeroExQuotes: ZeroExSwapQuoteResponse[];
  addressTokenBalances: AddressTokenBalance[];
  chainId: number;
  stealthAddresses: StealthAddressWithEphemeral[];
  addressNonces: Record<Hex, number | null>;
  gasInfo: ChainGasInfo[];
}) => {
  // Sanity check that all quotes are for the same token

  for (const quote of zeroExQuotes) {
    const transaction = quote.transaction;

    const client = getPublicClient({ chainId });

    const signer = stealthAddresses.find(
      stealthAddress => stealthAddress.address === quote.transaction.,
    );

    if (!signer) {
      throw new Error('Signer not found');
    }

    const userOp = buildUserOp({
      client,
      to: transaction.to,
      data: transaction.data,
      tag: '0x',
      stealthSigner: input.address,
      value: 0n,
      gasInfo,
      nonce: addressNonces[transaction.to],
    });
  }
};
*/
