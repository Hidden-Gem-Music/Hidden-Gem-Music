import { LinkingOptions } from "@react-navigation/native";
import * as ExpoLinking from "expo-linking";

import { ScreenRoute } from "../types/navigation";

export type RootStackParamList = {
  welcome: undefined;
  discovery: { year?: number } | undefined;
  country: { country?: string; year?: number } | undefined;
  hiddenGems: { country?: string; year?: number } | undefined;
  comparisonSelect: { year?: number } | undefined;
  comparisonResults: { year?: number } | undefined;
  dashboard: undefined;
  credits: undefined;
};

type NavigationSeed = {
  route: ScreenRoute;
  year?: number;
  countryId?: string;
};

const routeByPath: Record<string, ScreenRoute> = {
  "": "welcome",
  welcome: "welcome",
  discovery: "discovery",
  country: "country",
  "hidden-gems": "hiddenGems",
  compare: "comparisonSelect",
  "compare/results": "comparisonResults",
  dashboard: "dashboard",
  credits: "credits",
};

function parseYearValue(value: string | null | undefined) {
  const parsedYear = Number(value);
  return Number.isInteger(parsedYear) && parsedYear > 1000 && parsedYear < 3000 ? parsedYear : undefined;
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [ExpoLinking.createURL("/")],
  config: {
    initialRouteName: "welcome",
    screens: {
      welcome: "welcome",
      discovery: "discovery",
      country: "country",
      hiddenGems: "hidden-gems",
      comparisonSelect: "compare",
      comparisonResults: "compare/results",
      dashboard: "dashboard",
      credits: "credits",
    },
  },
};

export function getInitialNavigationSeed(): NavigationSeed {
  if (typeof window === "undefined" || !window.location?.href) {
    return { route: "welcome" };
  }
  try {
    const url = new URL(window.location.href);
    const normalizedPath = url.pathname.replace(/^\/+|\/+$/g, "");
    const route = routeByPath[normalizedPath] ?? "welcome";

    return {
      route,
      year: parseYearValue(url.searchParams.get("year")),
      countryId: url.searchParams.get("country") ?? undefined,
    };
  } catch {
    return { route: "welcome" };
  }
}

export function getRouteParams(route: ScreenRoute, selectedYear: number, selectedCountryId: string) {
  switch (route) {
    case "discovery":
    case "comparisonSelect":
    case "comparisonResults":
      return { year: selectedYear };
    case "country":
    case "hiddenGems":
      return {
        year: selectedYear,
        country: selectedCountryId,
      };
    default:
      return undefined;
  }
}
