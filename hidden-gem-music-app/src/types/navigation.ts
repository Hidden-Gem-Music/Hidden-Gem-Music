import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type ScreenRoute =
  | "welcome"
  | "discovery"
  | "country"
  | "hiddenGems"
  | "comparisonSelect"
  | "comparisonResults"
  | "dashboard"
  | "credits"
  | "search";

/** Param list for the root stack navigator. All screens are param-free; shared state lives in AppStateContext. */
export type RootStackParamList = {
  welcome: undefined;
  discovery: undefined;
  country: undefined;
  hiddenGems: undefined;
  comparisonSelect: undefined;
  comparisonResults: undefined;
  dashboard: undefined;
  credits: undefined;
  search: undefined;
};

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;
