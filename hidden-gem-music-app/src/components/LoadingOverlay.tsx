import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { Panel } from "./Panel";

const popupBottomDepthGradient = ["rgba(108,119,142,0)", "rgba(108,119,142,0.12)", "rgba(108,119,142,0.3)"] as const;

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
        <LinearGradient
          colors={popupBottomDepthGradient}
          locations={[0, 0.72, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.modalDepthFill}
        />
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 5000,
    backgroundColor: "rgba(22, 26, 38, 0.62)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 460,
    paddingVertical: 28,
    backgroundColor: "rgba(44, 46, 75, 0.96)",
    overflow: "hidden",
  },
  modalDepthFill: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    alignItems: "center",
    gap: 18,
  },
  title: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 32,
  },
  message: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 25,
  },
});
