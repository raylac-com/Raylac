import {
  buildUserOp,
  ChainGasInfo,
  getPublicClient,
  RaylacAccountAbi,
  ACCOUNT_IMPL_V2_ADDRESS,
  UserOperation,
  StealthAddressWithEphemeral,
} from '@raylac/shared';
import { encodeFunctionData, Hex } from 'viem';

export const EXPECTED_CONTRACT_IMPL = ACCOUNT_IMPL_V2_ADDRESS;

export const buildUpgradeUserOp = async ({
  stealthAccount,
  chainId,
  newImplementation,
  addressNonces,
  gasInfo,
}: {
  stealthAccount: StealthAddressWithEphemeral;
  chainId: number;
  newImplementation: Hex;
  addressNonces: Record<Hex, number | null>;
  gasInfo: ChainGasInfo[];
}): Promise<UserOperation> => {
  const data = encodeFunctionData({
    abi: RaylacAccountAbi,
    functionName: 'upgradeTo',
    args: [newImplementation],
  });
  const publicClient = getPublicClient({ chainId });

  const sender = stealthAccount.address;
  const nonce = addressNonces[sender] ?? null;

  const userOp = buildUserOp({
    client: publicClient,
    stealthSigner: stealthAccount.signerAddress,
    to: sender,
    value: 0n,
    data,
    gasInfo,
    tag: '0x',
    nonce,
    accountVersion: 1,
  });

  return userOp;
};
