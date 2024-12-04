import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import SwapSheet from './screens/Swap/components/SwapSheet/SwapSheet';
import SearchTokenSheet from './screens/Swap/components/SearchTokenSheet/SearchTokenSheet';
import { SupportedTokensReturnType } from '@raylac/shared';

registerSheet('swap-sheet', SwapSheet);
registerSheet('search-token-sheet', SearchTokenSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'swap-sheet': SheetDefinition;
    'search-token-sheet': SheetDefinition<{
      returnValue: SupportedTokensReturnType[number];
    }>;
  }
}

export {};
