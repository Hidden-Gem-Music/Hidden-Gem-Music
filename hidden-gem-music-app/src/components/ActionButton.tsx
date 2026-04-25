import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  label: string;
  onPress: () => void;
  size?: "default" | "compact" | "small";
};

const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;

export function ActionButton({ label, onPress, size = "default" }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const showGradient = isHovered || isPressed;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.buttonWrap,
        size === "compact" ? styles.buttonWrapCompact : null,
        size === "small" ? styles.buttonWrapSmall : null,
      ]}
    >
      {showGradient ? (
        <LinearGradient
          colors={isPressed ? activeGradient : hoverGradient}
          locations={[0, 0.34, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.buttonGradient}
        />
      ) : null}
      <View
        style={[
          styles.button,
          showGradient ? styles.buttonActive : null,
          size === "compact" ? styles.buttonCompact : null,
          size === "small" ? styles.buttonSmall : null,
        ]}
      >
        <Text style={[styles.label, showGradient ? styles.labelActive : null]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonWrap: {
    minWidth: 228,
    position: "relative",
    borderRadius: 17,
    overflow: "hidden",
  },
  buttonWrapCompact: {
    width: 224,
    minWidth: 224,
  },
  buttonWrapSmall: {
    width: 118,
    minWidth: 118,
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: colors.button,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  buttonActive: {
    backgroundColor: "transparent",
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
  labelActive: {
    color: colors.text,
  },
});
