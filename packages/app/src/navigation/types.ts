import { Token } from '@raylac/shared';
import { Hex } from 'viem';

export type RootTabsParamsList = {
  Home: undefined;
  Swap: undefined;
  History: undefined;
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
    amount: string;
    chainId: number;
    toAddress: Hex;
  };

  SaveBackupPhrase: undefined;
  ConfirmBackupPhrase: undefined;

  Addresses: undefined;
  AddAddress: undefined;
  CreateAddress: undefined;
};
