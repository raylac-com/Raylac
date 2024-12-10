import SearchTokenSheet from '@/components/SearchTokenSheet/SearchTokenSheet';
import { SupportedTokensReturnType } from '@raylac/shared';
import React, { createContext, useState, useContext } from 'react';

// Create the context
const SearchInputTokenSheetContext = createContext({
  isOpen: false,
  setIsOpen: (_isOpen: boolean) => {},
  selectedToken: null as SupportedTokensReturnType[number] | null,
  setSelectedToken: (_token: SupportedTokensReturnType[number]) => {},
});

// Create a provider component
export const SearchTokenSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<
    SupportedTokensReturnType[number] | null
  >(null);

  return (
    <SearchInputTokenSheetContext.Provider
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
    </SearchInputTokenSheetContext.Provider>
  );
};

// Create a custom hook for consuming the context
export const useSearchInputTokenSheet = () => {
  return useContext(SearchInputTokenSheetContext);
};
