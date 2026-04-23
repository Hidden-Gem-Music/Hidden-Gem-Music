import { StyleSheet, Text, View } from "react-native";

import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export function CreditsScreen() {
  return (
    <ScreenScaffold>
      <Text style={styles.title}>Credits</Text>
      <Panel style={styles.panel}>
        <View style={styles.section}>
          <Text style={styles.heading}>Project Team</Text>
          <Text style={styles.copy}>Eli: UI planning, frontend implementation, and product direction.</Text>
          <Text style={styles.copy}>Leena: data architecture, backend/API design, and stored procedures.</Text>
          <Text style={styles.copy}>Milton: location-aware datasets and supporting data resources.</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>Platform Notes</Text>
          <Text style={styles.copy}>Mapbox is staged for the globe/discovery experience.</Text>
          <Text style={styles.copy}>Spotify links are used here as a simple song follow-up path.</Text>
        </View>
      </Panel>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 56,
    fontWeight: "700",
  },
  panel: {
    minHeight: 420,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  heading: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 22,
  },
  copy: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 22,
    lineHeight: 34,
  },
});
