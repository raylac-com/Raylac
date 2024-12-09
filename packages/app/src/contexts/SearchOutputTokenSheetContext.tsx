import SearchTokenSheet from '@/components/SearchTokenSheet/SearchTokenSheet';
import { SupportedTokensReturnType } from '@raylac/shared';
import React, { createContext, useState, useContext } from 'react';

// Create the context
const SearchOutputTokenSheetContext = createContext({
  isOpen: false,
  setIsOpen: (_isOpen: boolean) => {},
  selectedToken: null as SupportedTokensReturnType[number] | null,
  setSelectedToken: (_token: SupportedTokensReturnType[number]) => {},
});

// Create a provider component
export const SearchOutputTokenSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<
    SupportedTokensReturnType[number] | null
  >(null);

  return (
    <SearchOutputTokenSheetContext.Provider
      value={{ isOpen, setIsOpen, selectedToken, setSelectedToken }}
    >
      {children}
      {isOpen && (
        <SearchTokenSheet
          onClose={() => setIsOpen(false)}
          onSelectToken={_token => {
            setSelectedToken(_token);
            setIsOpen(false);
          }}
        />
      )}
    </SearchOutputTokenSheetContext.Provider>
  );
};

// Create a custom hook for consuming the context
export const useSearchOutputTokenSheet = () => {
  return useContext(SearchOutputTokenSheetContext);
};
