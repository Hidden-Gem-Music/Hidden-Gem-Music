import type { Props } from "./SearchScreen.web";

import { NativeScreenPlaceholder } from "../components/NativeScreenPlaceholder";

export function SearchScreen(_props: Props) {
  return (
    <NativeScreenPlaceholder
      title="Search"
      message="This screen is owned by the web implementation in the current branch. Mobile will be handled separately."
    />
  );
}
