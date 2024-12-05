export type RootTabsParamsList = {
  Home: undefined;
};

export type RootStackParamsList = {
  Tabs: { screen: keyof RootTabsParamsList; params?: any };
  Start: undefined;

  SignInWithMnemonic: undefined;

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

  SaveBackupPhrase: undefined;
  ConfirmBackupPhrase: undefined;
};
