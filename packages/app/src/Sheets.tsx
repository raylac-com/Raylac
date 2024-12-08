import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import SwapSheet from './sheets/SwapSheet/components/SwapSheet/SwapSheet';
import SearchTokenSheet from './sheets/SwapSheet/components/SearchTokenSheet/SearchTokenSheet';
import { SupportedTokensReturnType } from '@raylac/shared';
import SwapDetailsSheet from './sheets/SwapDetailsSheet/SwapDetailsSheet';
import { GetSwapHistoryReturnType } from './types';

registerSheet('swap-sheet', SwapSheet);
registerSheet('search-token-sheet', SearchTokenSheet);
registerSheet('swap-details-sheet', SwapDetailsSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'swap-sheet': SheetDefinition;
    'search-token-sheet': SheetDefinition<{
      returnValue: SupportedTokensReturnType[number];
    }>;
    'swap-details-sheet': SheetDefinition<{
      payload: GetSwapHistoryReturnType[number];
    }>;
  }
}

export {};
