import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList, ScreenRoute } from "../types/navigation";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Navigate from anywhere outside of React components or outside NavigationContainer. */
export function navigate(route: ScreenRoute) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(route);
  }
}

/** Get the current route name. Returns undefined if the navigator is not yet ready. */
export function getCurrentRoute(): ScreenRoute | undefined {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name as ScreenRoute | undefined;
  }
  return undefined;
}
