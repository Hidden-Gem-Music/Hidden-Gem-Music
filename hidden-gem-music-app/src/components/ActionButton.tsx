import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  label: string;
  onPress: () => void;
  size?: "default" | "compact" | "small";
  buttonStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;

export function ActionButton({ label, onPress, size = "default", buttonStyle, labelStyle }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const nativeReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showGradient = isHovered || isPressed;

  useEffect(() => {
    return () => {
      if (nativeReleaseTimerRef.current) {
        clearTimeout(nativeReleaseTimerRef.current);
      }
    };
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPressIn={() => {
        setIsPressed(true);
        if (Platform.OS !== "web") {
          if (nativeReleaseTimerRef.current) {
            clearTimeout(nativeReleaseTimerRef.current);
            nativeReleaseTimerRef.current = null;
          }
        }
      }}
      onPressOut={() => {
        if (Platform.OS === "web") {
          setIsPressed(false);
          return;
        }

        nativeReleaseTimerRef.current = globalThis.setTimeout(() => {
          nativeReleaseTimerRef.current = null;
          setIsPressed(false);
        }, 180);
      }}
      style={[
        styles.buttonWrap,
        Platform.OS !== "web" && isPressed ? styles.buttonWrapPressed : null,
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
          Platform.OS !== "web" && isPressed ? styles.buttonPressedNative : null,
          size === "compact" ? styles.buttonCompact : null,
          size === "small" ? styles.buttonSmall : null,
          buttonStyle,
        ]}
      >
        <Text style={[styles.label, showGradient ? styles.labelActive : null, labelStyle]}>
          {label}
        </Text>
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
  buttonWrapPressed: {
    transform: [{ scale: 0.98 }],
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
    borderColor: colors.textDark,
    backgroundColor: colors.button,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  buttonActive: {
    backgroundColor: "transparent",
  },
  buttonPressedNative: {
    borderColor: colors.textLight,
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
    color: colors.textDark,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  labelActive: {
    color: colors.textLight,
  },
});
