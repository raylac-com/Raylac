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
    address: Hex;
  };
  SelectAmount: {
    address: Hex;
    token: Token;
  };
  SelectChain: {
    address: Hex;
    amount: string;
    token: Token;
  };
  ConfirmSend: {
    address: Hex;
    token: Token;
    amount: string;
    outputChainId: number;
  };

  SaveBackupPhrase: undefined;
  ConfirmBackupPhrase: undefined;

  AddAddress: undefined;
};
