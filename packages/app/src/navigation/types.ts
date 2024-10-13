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
  Deposit: undefined;
  TransferHistory: undefined;
  RaylacTransferDetails: {
    txHash: string;
  };
  NativeTransferDetails: {
    txHash: string;
    traceAddress: string;
  };
  IncomingERC20TransferDetails: {
    txIndex: number;
    logIndex: number;
    blockNumber: number;
    chainId: number;
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
};
