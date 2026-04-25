import type { Props } from "./ComparisonResultsScreen.web";

import { NativeScreenPlaceholder } from "../components/NativeScreenPlaceholder";

export function ComparisonResultsScreen(_props: Props) {
  return (
    <NativeScreenPlaceholder
      title="Comparison Results"
      message="This screen is owned by the web implementation in the current branch. Mobile will be handled separately."
    />
  );
}
