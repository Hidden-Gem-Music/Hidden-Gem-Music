import type { Props } from "./ComparisonSelectScreen.web";

import { NativeScreenPlaceholder } from "../components/NativeScreenPlaceholder";

export function ComparisonSelectScreen(_props: Props) {
  return (
    <NativeScreenPlaceholder
      title="Comparison Mode"
      message="This screen is owned by the web implementation in the current branch. Mobile will be handled separately."
    />
  );
}
