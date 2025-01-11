import { TokenAmount, Token } from '@raylac/shared';
import { Hex } from 'viem';

export type RootTabsParamsList = {
  Home: undefined;
  Swap:
    | {
        fromToken: Token;
        bridge?: boolean;
      }
    | undefined;
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
        pendingSwap?: {
          address: Hex;
          tokenIn: Token;
          tokenOut: Token;
          inputAmount: TokenAmount;
          outputAmount: TokenAmount;
          chainId: number;
          requestId: Hex;
        };
        pendingCrossChainSwap?: {
          address: Hex;
          tokenIn: Token;
          tokenOut: Token;
          amountIn: TokenAmount;
          amountOut: TokenAmount;
          fromChainId: number;
          toChainId: number;
          requestId: Hex;
        };
        pendingBridge?: {
          address: Hex;
          token: Token;
          amountIn: TokenAmount;
          amountOut: TokenAmount;
          fromChainId: number;
          toChainId: number;
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

  BackupAccount: undefined;
  Advanced: undefined;
  SelectLanguage: undefined;

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

  SaveBackupPhrase: {
    genesisAddress: Hex;
  };
  ConfirmBackupPhrase: {
    genesisAddress: Hex;
  };

  AddAddress: undefined;
  CreateAddress: undefined;
  EditAddressLabel: {
    address: Hex;
  };
};
