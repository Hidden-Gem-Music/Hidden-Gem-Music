import type { Props } from "./HiddenGemsScreen.web";

import { NativeScreenPlaceholder } from "../components/NativeScreenPlaceholder";

export function HiddenGemsScreen(_props: Props) {
  return (
    <NativeScreenPlaceholder
      title="Hidden Gem Songs"
      message="This screen is owned by the web implementation in the current branch. Mobile will be handled separately."
    />
  );
}
