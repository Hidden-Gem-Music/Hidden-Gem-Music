import type { Props } from "./WelcomeScreen.web";

import { NativeScreenPlaceholder } from "../components/NativeScreenPlaceholder";

export function WelcomeScreen(_props: Props) {
  return (
    <NativeScreenPlaceholder
      title="Welcome"
      message="This screen is owned by the web implementation in the current branch. Mobile will be handled separately."
    />
  );
}
