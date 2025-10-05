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

// Auth screen props type
export type AuthScreenProps<T extends keyof AuthStackParamList> = {
  navigation: any;
  route: {
    params: AuthStackParamList[T];
  };
};

// Main screen props type
export type MainScreenProps<T extends keyof MainStackParamList> = {
  navigation: any;
  route: {
    params: MainStackParamList[T];
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
