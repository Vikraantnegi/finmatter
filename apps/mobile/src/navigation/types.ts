/**
 * Navigation types for FinMatter mobile app
 */

import { RootStackParamList as AuthStackParamList } from './AuthNavigator';
import { RootStackParamList as MainStackParamList } from './MainNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
} & AuthStackParamList &
  MainStackParamList;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
