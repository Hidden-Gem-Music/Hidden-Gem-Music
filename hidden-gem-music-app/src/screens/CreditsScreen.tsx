import { StyleSheet } from "react-native";

import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";

export function CreditsScreen() {
  return (
    <ScreenScaffold>
      <Panel style={styles.panel}>{null}</Panel>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: 420,
  },
});
