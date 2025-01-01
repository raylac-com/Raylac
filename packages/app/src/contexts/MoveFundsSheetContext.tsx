import MoveFundsSheet from '@/components/MoveFundsSheet/MoveFundsSheet';
import React, { createContext, useState, useContext } from 'react';

// Create the context
const MoveFundsSheetContext = createContext({
  isOpen: false,
  setIsOpen: (_isOpen: boolean) => {},
});

// Create a provider component
export const MoveFundsSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MoveFundsSheetContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      <MoveFundsSheet />
    </MoveFundsSheetContext.Provider>
  );
};

// Create a custom hook for consuming the context
export const useMoveFundsSheet = () => {
  return useContext(MoveFundsSheetContext);
};
