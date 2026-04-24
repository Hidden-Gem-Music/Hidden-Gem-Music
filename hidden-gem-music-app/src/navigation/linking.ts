import type { LinkingOptions } from "@react-navigation/native";

import type { RootStackParamList } from "../types/navigation";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      welcome: "",
      discovery: "discovery",
      country: "country",
      hiddenGems: "hidden-gems",
      comparisonSelect: "compare",
      comparisonResults: "compare/results",
      dashboard: "dashboard",
      credits: "credits",
      search: "search",
    },
  },
};
