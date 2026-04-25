import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

import { colors } from "../theme/colors";

export function SecondarySurfaceFill() {
  return (
    <LinearGradient
      colors={[
        colors.surfaceSecondary,
        "#27293B",
        "#332E41",
        "#4A3E51",
        "#70536A",
      ]}
      locations={[0, 0.34, 0.62, 0.84, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.fill}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
