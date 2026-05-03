import type { Props } from "./DashboardScreen.web";

import { NativeScreenPlaceholder } from "../components/NativeScreenPlaceholder";

export function DashboardScreen(_props: Props) {
  return (
    <NativeScreenPlaceholder
      title="Dashboard"
      message="This screen is owned by the web implementation in the current branch. Mobile will be handled separately."
    />
  );
}
