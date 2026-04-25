import type { Props } from "./DiscoveryScreen.web";

import { NativeScreenPlaceholder } from "../components/NativeScreenPlaceholder";

export function DiscoveryScreen(_props: Props) {
  return (
    <NativeScreenPlaceholder
      title="Discovery Globe"
      message="This screen is owned by the web implementation in the current branch. Mobile will be handled separately."
    />
  );
}
