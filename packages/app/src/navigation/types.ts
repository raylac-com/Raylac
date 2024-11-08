import { User } from '@/types';
import { Hex } from 'viem';

export type RootTabsParamsList = {
  Home: undefined;
  Account: undefined;
};

export type RootStackParamsList = {
  Tabs: { screen: keyof RootTabsParamsList; params?: any };
  Start: undefined;
  SignIn: undefined;
  SignUp: undefined;

  SupportedChains: undefined;
  SupportedTokens: {
    chainId: number;
  };

  SignInWithMnemonic: undefined;

  AccountInfo: undefined;
  UpdateDisplayName: undefined;
  UpdateUsername: undefined;

  // Send stack
  SelectRecipient: undefined;
  EnterSendAmount: {
    recipientUserOrAddress: User | Hex;
  };
  ConfirmSend: {
    recipientUserOrAddress: User | Hex;
    tokenId: string;
    amount: string;
    outputChainId?: number;
  };

  // Deposit stack
  Deposit: undefined;
  TransferHistory: undefined;
  TransferDetails: {
    txHash: string;
  };
  Receive: undefined;
  BackupAccount: undefined;
  Advanced: undefined;
  SelectLanguage: undefined;
  SendSuccess: undefined;

  // Address stack
  Addresses: undefined;

  SaveBackupPhrase: undefined;
  ConfirmBackupPhrase: undefined;

  Upgrade: undefined;
};
