import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import HomeOtherMenusActionSheet from './components/HomeOtherMenusActionSheet';

registerSheet('home-other-menus', HomeOtherMenusActionSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'home-other-menus': SheetDefinition;
  }
}

export {};
