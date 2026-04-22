import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { Panel } from "./Panel";

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
};

export function LoadingOverlay({
  visible,
  title = "Updating View",
  message = "Refreshing the selected year and rebuilding the screen data.",
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Panel style={styles.modal}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <ActivityIndicator size="large" color={colors.accentSoft} />
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(22, 26, 38, 0.62)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
    gap: 18,
    paddingVertical: 28,
    backgroundColor: "rgba(44, 46, 75, 0.96)",
  },
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 34,
  },
  message: {
    color: colors.text,
    fontFamily: typefaces.body,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 28,
  },
});
