import { TokenAmount, Token } from '@raylac/shared';
import { Hex } from 'viem';

export type RootTabsParamsList = {
  Home: undefined;
  Swap: undefined;
  History:
    | {
        pendingTransfer?: {
          txHash: Hex;
          from: Hex;
          to: Hex;
          chainId: number;
          token: Token;
          amount: TokenAmount;
        };
        pendingBridgeTransfer?: {
          from: Hex;
          to: Hex;
          fromChainId: number;
          toChainId: number;
          token: Token;
          amount: TokenAmount;
          requestId: Hex;
        };
      }
    | undefined;
  Addresses: undefined;
  Settings: undefined;
};

export type RootStackParamsList = {
  Tabs: { screen: keyof RootTabsParamsList; params?: any };
  Start: undefined;
  StartWatch: undefined;
  CreateAccount: undefined;
  ImportAccount: undefined;

  AccountInfo: undefined;

  // Send stack
  TransferHistory: undefined;
  TransferDetails: {
    transferId: number;
  };

  TokenBalances: undefined;
  TokenBalanceDetails: {
    tokenId: string;
  };

  BackupAccount: undefined;
  Advanced: undefined;
  SelectLanguage: undefined;
  SendSuccess: undefined;

  // Send stack
  SelectRecipient: undefined;
  SelectToken: {
    toAddress: Hex;
  };
  SelectFromAddress: {
    toAddress: Hex;
    token: Token;
    chainId: number;
  };
  SelectAmount: {
    toAddress: Hex;
    fromAddresses: Hex[];
    token: Token;
    chainId: number;
  };
  SelectChain: {
    toAddress: Hex;
    token: Token;
  };
  ConfirmSend: {
    fromAddresses: Hex[];
    token: Token;
    amount: TokenAmount;
    chainId: number;
    toAddress: Hex;
  };
  MoveFunds: undefined;

  SaveBackupPhrase: {
    genesisAddress: Hex;
  };
  ConfirmBackupPhrase: {
    genesisAddress: Hex;
  };

  AddAddress: undefined;
  CreateAddress: undefined;
};
