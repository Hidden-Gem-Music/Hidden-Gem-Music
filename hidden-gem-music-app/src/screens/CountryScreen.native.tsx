import type { Props } from "./CountryScreen.web";

import { NativeScreenPlaceholder } from "../components/NativeScreenPlaceholder";

export function CountryScreen(_props: Props) {
  return (
    <NativeScreenPlaceholder
      title="Country Page"
      message="This screen is owned by the web implementation in the current branch. Mobile will be handled separately."
    />
  );
}
