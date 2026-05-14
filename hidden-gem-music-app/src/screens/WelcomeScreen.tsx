import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  onDismiss: () => void;
  onSelectRoute: (route: ScreenRoute) => void;
};

const popupBottomDepthGradient = ["rgba(108,119,142,0)", "rgba(108,119,142,0.12)", "rgba(108,119,142,0.3)"] as const;
const welcomeTitleWebGradientStyle =
  Platform.OS === "web"
    ? ({
        backgroundImage: `linear-gradient(90deg, ${colors.navGradient} 0%, ${colors.navGradient} 14%, ${colors.backgroundSoft} 36%, ${colors.backgroundSoft} 100%)`,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      } as const)
    : null;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3 ? normalized.split("").map((char) => `${char}${char}`).join("") : normalized;

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function interpolateHexColor(startHex: string, endHex: string, ratio: number) {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  const safeRatio = Math.max(0, Math.min(1, ratio));
  const mix = (from: number, to: number) => Math.round(from + (to - from) * safeRatio);
  const channelToHex = (value: number) => value.toString(16).padStart(2, "0");

  return `#${channelToHex(mix(start.r, end.r))}${channelToHex(mix(start.g, end.g))}${channelToHex(
    mix(start.b, end.b)
  )}`;
}

function WelcomeGradientTitle() {
  if (Platform.OS === "web") {
    return <Text style={[styles.brand, welcomeTitleWebGradientStyle as any]}>Hidden Gem Music</Text>;
  }

  const title = "Hidden Gem Music";
  const characters = title.split("");
  const maxIndex = Math.max(characters.length - 1, 1);

  return (
    <Text style={styles.brand}>
      {characters.map((character, index) => {
        const progress = index / maxIndex;
        const color =
          progress <= 0.14
            ? colors.navGradient
            : progress >= 0.36
              ? colors.backgroundSoft
              : interpolateHexColor(colors.navGradient, colors.backgroundSoft, (progress - 0.14) / 0.22);

        return (
          <Text key={`welcome-gradient-char-${index}`} style={{ color }}>
            {character}
          </Text>
        );
      })}
    </Text>
  );
}

export function WelcomeScreen({ onDismiss, onSelectRoute }: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissWithAction = (action: () => void) => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    const closeDelay = Platform.OS === "web" ? 120 : 24;
    closeTimerRef.current = globalThis.setTimeout(() => {
      action();
    }, closeDelay);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  return (
    <View
      style={styles.overlay}
      pointerEvents="auto"
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
    >
      <Pressable
        style={styles.overlayBackdropPressTarget}
        onPress={(event) => {
          event.stopPropagation();
          dismissWithAction(onDismiss);
        }}
      >
        <View style={styles.overlayBackdrop} />
      </Pressable>
      <Pressable style={styles.modalPressTarget} onPress={(event) => event.stopPropagation()}>
        <Panel style={styles.modal}>
          <LinearGradient
            colors={popupBottomDepthGradient}
            locations={[0, 0.72, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.modalDepthFill}
          />
          <View style={styles.modalContent}>
            <WelcomeGradientTitle />
            <Text style={styles.summary}>
              The purpose of this app is to find and display the 'Discovery Gap' — What music is most loved in each
              country, and how much was that country's most loved music spread, shared, and loved by other countries?
              Explore the Discovery Gap multiple ways: the discovery map, country detail pages, comparison mode,
              listen to 30 second previews of hidden gems, and the discovery dashboard (name TBD). Utilize filters in
              multiple areas of the app to fine tune your discovery.
            </Text>
            <View style={styles.buttonStack}>
              <ActionButton label="Discovery Map" size="compact" onPress={() => dismissWithAction(() => onSelectRoute("discovery"))} />
              <ActionButton
                label="Comparison Mode"
                size="compact"
                onPress={() => dismissWithAction(() => onSelectRoute("comparisonSelect"))}
              />
              <ActionButton
                label="Hidden Gems"
                size="compact"
                onPress={() => dismissWithAction(() => onSelectRoute("hiddenGems"))}
              />
              <ActionButton label="Dashboard" size="compact" onPress={() => dismissWithAction(() => onSelectRoute("dashboard"))} />
              <ActionButton label="Credits" size="compact" onPress={() => dismissWithAction(() => onSelectRoute("credits"))} />
            </View>
          </View>
        </Panel>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 9999,
  },
  overlayBackdropPressTarget: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22,26,38,0.56)",
  },
  modalPressTarget: {
    width: "100%",
    maxWidth: 760,
  },
  modal: {
    width: "100%",
    maxWidth: 760,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(169, 176, 209, 0.24)",
    overflow: "hidden",
  },
  modalDepthFill: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    alignItems: "center",
    gap: 22,
  },
  brand: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
  },
  summary: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 25,
    textAlign: "center",
    maxWidth: 620,
  },
  buttonStack: {
    gap: 14,
    alignItems: "center",
  },
});
