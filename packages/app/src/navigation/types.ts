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
  SignUp: {
    inviteCode: string;
  };
  EnterInviteCode: undefined;

  SignInWithMnemonic: undefined;

  // Send stack
  SelectSend: undefined;
  SendToNonSutoriUser: undefined;
  SendToSutoriUser: undefined;
  EnterSendAmount: {
    recipientUserOrAddress: User | Hex;
  };
  ConfirmSend: {
    recipientUserOrAddress: User | Hex;
    amount: number;
  };

  // Deposit stack
  EnterDepositAmount: undefined;
  ConfirmDeposit: {
    address: string;
    amount: number;
  };
  TransferHistory: undefined;
  BackupAccount: undefined;
  SelectLanguage: undefined;
  SendSuccess: undefined;
};
