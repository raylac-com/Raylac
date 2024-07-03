import { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabsParamsList = {
  Home: undefined;
  Account: undefined;
};

export type DepositStackParamsList = {
  EnterDepositInfo: undefined;
  ConfirmDeposit: {
    address: string;
    amount: number;
  };
};

export type SendStackParamsList = {
  Send: undefined;
  SendToNonSutoriUser: undefined;
  SendToSutoriUser: undefined;
};

export type RootStackParamsList = {
  Tabs: { screen: keyof RootTabsParamsList; params?: any };
  SignUp: undefined;
  Send: undefined;
  SendToSutoriUser: undefined;
  SendToNonSutoriUser: undefined;
  EnterDepositInfo: undefined;
  ConfirmDeposit: undefined;
  Receive: undefined;
};