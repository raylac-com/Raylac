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
    outputChainId: number;
    amount: string;
  };

  // Deposit stack
  ConfirmDeposit: {
    address: string;
    amount: number;
  };
  TransferHistory: undefined;
  TransferDetails: {
    transferIdOrTxHash: string;
  };
  Receive: undefined;
  BackupAccount: undefined;
  SelectLanguage: undefined;
  SendSuccess: undefined;

  // Address stack
  Addresses: undefined;
};
