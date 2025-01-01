import { Token } from '@raylac/shared';
import React, { createContext, useState, useContext } from 'react';
import { Hex } from 'viem';

// Create the context
const MoveFundsContext = createContext<{
  isSheetOpen: boolean;
  setIsSheetOpen: (isSheetOpen: boolean) => void;
  toAddress: Hex | null;
  setToAddress: (toAddress: Hex | null) => void;
  fromAddress: Hex | null;
  setFromAddress: (fromAddress: Hex | null) => void;
  token: Token | null;
  setToken: (token: Token | null) => void;
  fromChainId: number | null;
  setFromChainId: (fromChainId: number | null) => void;
  toChainId: number | null;
  setToChainId: (toChainId: number | null) => void;
}>({
  isSheetOpen: false,
  setIsSheetOpen: () => {},
  toAddress: null,
  setToAddress: () => {},
  fromAddress: null,
  setFromAddress: () => {},
  token: null,
  setToken: () => {},
  fromChainId: null,
  setFromChainId: () => {},
  toChainId: null,
  setToChainId: () => {},
});

// Create a provider component
export const MoveFundsContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [toAddress, setToAddress] = useState<Hex | null>(null);
  const [fromAddress, setFromAddress] = useState<Hex | null>(null);
  const [token, setToken] = useState<Token | null>(null);
  const [fromChainId, setFromChainId] = useState<number | null>(null);
  const [toChainId, setToChainId] = useState<number | null>(null);

  return (
    <MoveFundsContext.Provider
      value={{
        isSheetOpen,
        setIsSheetOpen,
        toAddress,
        setToAddress,
        fromAddress,
        setFromAddress,
        token,
        setToken,
        fromChainId,
        setFromChainId,
        toChainId,
        setToChainId,
      }}
    >
      {children}
    </MoveFundsContext.Provider>
  );
};

// Create a custom hook for consuming the context
export const useMoveFundsContext = () => {
  return useContext(MoveFundsContext);
};
