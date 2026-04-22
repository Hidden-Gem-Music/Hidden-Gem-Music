import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  label: string;
  onPress: () => void;
  size?: "default" | "compact" | "small";
};

export function ActionButton({ label, onPress, size = "default" }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.buttonWrap,
        size === "compact" ? styles.buttonWrapCompact : null,
        size === "small" ? styles.buttonWrapSmall : null,
      ]}
    >
      {({ pressed }) => (
        <LinearGradient
          colors={pressed ? [colors.buttonPressed, colors.buttonPressed] : [colors.button, colors.button]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            size === "compact" ? styles.buttonCompact : null,
            size === "small" ? styles.buttonSmall : null,
          ]}
        >
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonWrap: {
    minWidth: 228,
  },
  buttonWrapCompact: {
    width: 224,
    minWidth: 224,
  },
  buttonWrapSmall: {
    width: 118,
    minWidth: 118,
  },
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  buttonCompact: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});
