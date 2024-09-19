import { User } from '@/types';
import { Hex } from 'viem';

export type RootTabsParamsList = {
  Home: undefined;
  Account: undefined;
  Card: undefined;
};

export type RootStackParamsList = {
  Tabs: { screen: keyof RootTabsParamsList; params?: any };
  Start: undefined;
  SignIn: undefined;
  SignUp: {
    inviteCode: string;
  };
  EnterInviteCode: undefined;

  SignInWithMnemonic: undefined;

  CardInfo: undefined;

  AccountInfo: undefined;
  UpdateDisplayName: undefined;
  UpdateUsername: undefined;

  // Send stack
  SelectSend: undefined;
  SendToNonSutoriUser: undefined;
  SendToSutoriUser: undefined;
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
  EnterDepositAmount: undefined;
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

  // Token stack
  TokenBalance: undefined;
};
