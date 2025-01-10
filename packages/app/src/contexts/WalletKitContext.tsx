import { createContext, useContext } from 'react';
import { WalletKit } from '@reown/walletkit';

type WalletKitInstance = Awaited<ReturnType<typeof WalletKit.init>>;
const WalletKitContext = createContext<WalletKitInstance | null>(null);

export const WalletKitProvider = WalletKitContext.Provider;

export function useWalletKit() {
  const context = useContext(WalletKitContext);
  if (!context) {
    throw new Error('useWalletKit must be used within a WalletKitProvider');
  }
  return context;
}
