import {
  buildTransferUseOp,
  encodePaymasterAndData,
  getGasInfo,
  getTokenAddressOnChain,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  StealthAddressWithEphemeral,
  UserActionType,
  UserOperation,
  encodeUserActionTag,
} from '@raylac/shared';
import getAddressBalancesPerChain from './getAddressBalancesPerChain';
import { toHex } from 'viem/utils';
import getStealthAccounts from './getStealthAccounts';
import { Hex } from 'viem';
import paymasterSignUserOp from './paymasterSignUserOp';

interface InputAddress {
  address: Hex;
  chainId: number;
  amount: bigint;
}

const chooseInputs = async ({
  userId,
  tokenId,
  amount,
}: {
  userId: number;
  tokenId: string;
  amount: bigint;
}): Promise<InputAddress[]> => {
  const addressBalances = await getAddressBalancesPerChain({ userId });

  // Filter out stealth accounts with non-zero balance of the output token
  const sortedAddressTokenBalances = addressBalances
    .filter(
      addressTokenBalance =>
        addressTokenBalance.tokenId === tokenId &&
        addressTokenBalance.balance !== '0'
    )
    // Sort by balance in descending order
    .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

  // Array of stealth accounts that will be used as inputs
  const sendFromAccounts: InputAddress[] = [];

  // Set the remaining amount that needs to be sent.
  // This is subtracted as we find stealth accounts with enough funds.
  let remainingAmount = amount;

  for (const addressTokenBalance of sortedAddressTokenBalances) {
    const balance = BigInt(addressTokenBalance.balance);

    if (balance >= remainingAmount) {
      // The account has more than enough funds to cover the remaining amount
      sendFromAccounts.push({
        address: addressTokenBalance.address,
        chainId: addressTokenBalance.chainId,
        amount: remainingAmount,
      });
      remainingAmount = BigInt(0);
      break;
    } else {
      sendFromAccounts.push({
        address: addressTokenBalance.address,
        chainId: addressTokenBalance.chainId,
        amount: balance,
      });
    }

    remainingAmount -= balance;
  }

  if (remainingAmount === BigInt(0)) {
    // There are enough funds on the destination chain.
    // The user can send from accounts from/to the specified destination chain.
    return sendFromAccounts;
  }

  if (remainingAmount !== BigInt(0)) {
    throw new Error('Not enough funds');
  }

  return sendFromAccounts;
};

const buildMultiChainSendUserOps = async ({
  to,
  userId,
  tokenId,
  amount,
}: {
  to: Hex;
  userId: number;
  tokenId: string;
  amount: string;
}) => {
  // Choose input addresses
  const inputAddresses = await chooseInputs({
    userId,
    tokenId,
    amount: BigInt(amount),
  });

  // Group the inputs by chain
  const inputsByChain: Record<number, InputAddress[]> = {};
  for (const input of inputAddresses) {
    inputsByChain[input.chainId] = [
      ...(inputsByChain[input.chainId] ?? []),
      input,
    ];
  }

  const groupTag = toHex(
    Buffer.from(crypto.getRandomValues(new Uint8Array(32)))
  );

  if (groupTag.length !== 66) {
    throw new Error(`Invalid tag length: ${groupTag}`);
  }

  const groupSize = Object.keys(inputsByChain).length;

  const tag = encodeUserActionTag({
    groupTag,
    groupSize,
    userActionType: UserActionType.Transfer,
  });

  // Get gas info for the chains we are making transfers on
  const chainIds = Object.keys(inputsByChain).map(Number);
  const gasInfo = await getGasInfo({
    chainIds,
  });

  // Get the stealth accounts for the user
  const userStealthAccounts = await getStealthAccounts({
    userId,
  });

  // Array of stealth accounts that will be used in the multi-chain transfer
  // We return this array to the client so they can sign the user operations by recovering the stealth account private keys

  const userOps: {
    userOp: UserOperation;
    stealthAccount: StealthAddressWithEphemeral;
  }[] = [];

  // Build user operations for each chain
  for (const [_chainId, chainInputs] of Object.entries(inputsByChain)) {
    const chainId = Number(_chainId);

    const consolidateTo = chainInputs[0];

    const chainGasInfo = gasInfo.find(gasInfo => gasInfo.chainId === chainId);

    if (!chainGasInfo) {
      throw new Error(`Chain gas info not found for ${chainId}`);
    }

    const tokenAddress = getTokenAddressOnChain({
      chainId: chainId,
      tokenId,
    });

    for (const input of chainInputs) {
      if (consolidateTo.address === input.address) {
        continue;
      }

      // Get the stealth signer address that corresponds to the input address
      const stealthAccount = userStealthAccounts.find(
        stealthAccount => stealthAccount.address === input.address
      );

      if (!stealthAccount) {
        throw new Error(`Stealth address not found for ${input.address}`);
      }

      // Build a standard transfer user operation
      const userOp = buildTransferUseOp({
        stealthSigner: stealthAccount.signerAddress as Hex,
        to: consolidateTo.address,
        tokenAddress,
        amount: input.amount,
        chainId: input.chainId,
        nonce: stealthAccount.nonce,
        tag,
        gasInfo: chainGasInfo,
      });

      userOps.push({
        userOp,
        stealthAccount: {
          address: stealthAccount.address as Hex,
          viewTag: stealthAccount.viewTag as Hex,
          signerAddress: stealthAccount.signerAddress as Hex,
          ephemeralPubKey: stealthAccount.ephemeralPubKey as Hex,
        },
      });
    }

    const consolidateToStealthAccount = userStealthAccounts.find(
      stealthAccount => stealthAccount.address === consolidateTo.address
    );

    if (!consolidateToStealthAccount) {
      throw new Error(`Stealth address not found for ${consolidateTo.address}`);
    }

    // Send to the recipient from the consolidated account
    const userOp = buildTransferUseOp({
      stealthSigner: consolidateToStealthAccount.signerAddress as Hex,
      to,
      tokenAddress,
      amount: BigInt(amount),
      chainId,
      nonce: consolidateToStealthAccount.nonce,
      tag,
      gasInfo: chainGasInfo,
    });

    userOps.push({
      userOp,
      stealthAccount: {
        address: consolidateToStealthAccount.address as Hex,
        viewTag: consolidateToStealthAccount.viewTag as Hex,
        signerAddress: consolidateToStealthAccount.signerAddress as Hex,
        ephemeralPubKey: consolidateToStealthAccount.ephemeralPubKey as Hex,
      },
    });
  }

  const paymasterSignedUserOps = await Promise.all(
    userOps.map(async userOp => {
      const paymasterSig = await paymasterSignUserOp(userOp.userOp);

      const paymasterAndData = encodePaymasterAndData({
        paymaster: RAYLAC_PAYMASTER_V2_ADDRESS,
        data: paymasterSig,
      });

      return {
        userOp: {
          ...userOp.userOp,
          paymasterAndData,
        },
        stealthAccount: userOp.stealthAccount,
      };
    })
  );

  return paymasterSignedUserOps;
};

export default buildMultiChainSendUserOps;
