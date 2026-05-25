import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { ACCESS_CODE, writeAccessGranted } from "../config/accessGate";
import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  accessGranted: boolean;
  onAccessGranted: () => void;
  onDismiss: () => void;
  onSelectRoute: (route: ScreenRoute) => void;
};

const popupBottomDepthGradient = ["rgba(108,119,142,0)", "rgba(108,119,142,0.12)", "rgba(108,119,142,0.3)"] as const;
const welcomeBackdropGradient = ["#181C2A", "#222639", "#3A3043", "#75526B"] as const;
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

function WelcomeGradientTitle({ compact = false }: { compact?: boolean }) {
  const titleStyle = [styles.brand, compact ? styles.brandCompact : null];

  if (Platform.OS === "web") {
    return <Text style={[titleStyle, welcomeTitleWebGradientStyle as any]}>Hidden Gem Music</Text>;
  }

  const title = "Hidden Gem Music";
  const characters = title.split("");
  const maxIndex = Math.max(characters.length - 1, 1);

  return (
    <Text style={titleStyle}>
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

export function WelcomeScreen({ accessGranted, onAccessGranted, onDismiss, onSelectRoute }: Props) {
  const { width } = useWindowDimensions();
  const isCompactWelcome = width < 980;
  const isMobileWelcome = Platform.OS !== "web";
  const useFullScreenBackdrop = Platform.OS === "web" && !isCompactWelcome;
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [accessError, setAccessError] = useState("");
  const [accessInputFocused, setAccessInputFocused] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClosingRef = useRef(false);

  const dismissWithAction = (action: () => void) => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    setIsClosing(true);
    const closeDelay = Platform.OS === "web" ? 120 : 80;
    closeTimerRef.current = globalThis.setTimeout(() => {
      action();
    }, closeDelay);
  };

  const handleAccessSubmit = () => {
    if (accessCodeInput.trim().toUpperCase() !== ACCESS_CODE) {
      setAccessError("Access code invalid.");
      return;
    }

    writeAccessGranted();
    setAccessError("");
    onAccessGranted();
  };

  const renderWelcomeButtons = (hidden = false) => (
    <View style={[styles.buttonStack, isMobileWelcome ? styles.buttonStackMobile : null]} pointerEvents={hidden ? "none" : "auto"}>
      <ActionButton label="Discovery Map" size="compact" onPress={() => dismissWithAction(() => onSelectRoute("discovery"))} />
      <ActionButton label="Discovery Dashboard" size="compact" onPress={() => dismissWithAction(() => onSelectRoute("dashboard"))} />
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
      <ActionButton label="Credits" size="compact" onPress={() => dismissWithAction(() => onSelectRoute("credits"))} />
    </View>
  );

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      isClosingRef.current = false;
    };
  }, []);

  if (isClosing) {
    return <View style={styles.closedOverlay} pointerEvents="none" />;
  }

  return (
    <KeyboardAvoidingView
      behavior={isMobileWelcome && Platform.OS === "ios" ? "padding" : undefined}
      enabled={isMobileWelcome}
      keyboardVerticalOffset={isMobileWelcome ? 18 : 0}
      style={[styles.overlay, isCompactWelcome ? styles.overlayCompact : null]}
      pointerEvents={useFullScreenBackdrop ? "auto" : "box-none"}
      onStartShouldSetResponder={useFullScreenBackdrop ? () => true : undefined}
      onMoveShouldSetResponder={useFullScreenBackdrop ? () => true : undefined}
    >
      {useFullScreenBackdrop ? (
        <Pressable
          style={styles.overlayBackdropPressTarget}
          onPress={(event) => {
            event.stopPropagation();
            if (accessGranted) {
              dismissWithAction(onDismiss);
            }
          }}
        >
          <WelcomeBackdrop style={styles.overlayBackdrop} />
        </Pressable>
      ) : (
        <WelcomeBackdrop style={styles.overlayBackdrop} pointerEvents="none" useGradient />
      )}
      <Pressable style={styles.modalPressTarget} onPress={(event) => event.stopPropagation()}>
        <Panel style={[styles.modal, isMobileWelcome ? styles.modalMobile : null]}>
          <LinearGradient
            colors={popupBottomDepthGradient}
            locations={[0, 0.72, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.modalDepthFill}
          />
          <View style={[styles.modalContent, isMobileWelcome ? styles.modalContentMobile : null]}>
            <WelcomeGradientTitle compact={isMobileWelcome} />
            <Text style={[styles.summary, isMobileWelcome ? styles.summaryMobile : null]}>
              The purpose of this app is to find and display the 'Discovery Gap' — What music is most loved in each
              country, and how much was that country's most loved music spread, shared, and loved by other countries?
              Explore the Discovery Gap multiple ways: the discovery map, country detail pages, comparison mode,
              listen to 30 second previews of hidden gems, and the Discovery Dashboard. Utilize filters in
              multiple areas of the app to fine tune your discovery.
            </Text>
            {accessGranted ? (
              renderWelcomeButtons()
            ) : (
              <View style={[styles.accessLayerSlot, isMobileWelcome ? styles.accessLayerSlotMobile : null]}>
                <View style={[styles.buttonStackSpacer, isMobileWelcome ? styles.buttonStackSpacerMobile : null]} pointerEvents="none" />
                <View style={[styles.accessContent, isMobileWelcome ? styles.accessContentMobile : styles.accessContentWeb]}>
                  <View style={[styles.accessSummarySlot, isMobileWelcome ? styles.accessSummarySlotMobile : null]}>
                    <Text style={[styles.accessSummary, isMobileWelcome ? styles.accessSummaryMobile : null]}>
                      Hidden Gem Music is currently in{" "}
                      <Text style={styles.accessSummaryAccent}>limited early access</Text>, and is only available to
                      invited testers and supporters who are given an access code.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.accessFieldGroup,
                      isMobileWelcome ? styles.accessFieldGroupMobile : styles.accessFieldGroupWeb,
                    ]}
                  >
                    <Text style={styles.accessLabel}>Access code:</Text>
                    <TextInput
                      value={accessCodeInput}
                      onChangeText={(value) => {
                        setAccessCodeInput(value);
                        if (accessError) {
                          setAccessError("");
                        }
                      }}
                    onSubmitEditing={handleAccessSubmit}
                    onFocus={() => setAccessInputFocused(true)}
                    onBlur={() => setAccessInputFocused(false)}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    spellCheck={false}
                    returnKeyType="done"
                    placeholder="Enter access code"
                    placeholderTextColor="rgba(169, 176, 209, 0.62)"
                    style={[styles.accessInput, accessInputFocused ? styles.accessInputFocused : null]}
                  />
                    <Text style={[styles.accessError, accessError ? null : styles.accessErrorHidden]}>
                      {accessError || "Access code invalid."}
                    </Text>
                  </View>
                  <View style={[styles.accessButtonOffset, isMobileWelcome ? styles.accessButtonOffsetMobile : styles.accessButtonOffsetWeb]}>
                    <ActionButton
                      label="Enter Hidden Gems Music"
                      size="compact"
                      buttonStyle={styles.accessButton}
                      labelStyle={styles.accessButtonLabel}
                      onPress={handleAccessSubmit}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </Panel>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function WelcomeBackdrop({ style, pointerEvents, useGradient = false }: { style: any; pointerEvents?: "none"; useGradient?: boolean }) {
  if (!useGradient) {
    return <View style={[style, styles.webOverlayBackdrop]} pointerEvents={pointerEvents} />;
  }

  return (
    <LinearGradient
      colors={welcomeBackdropGradient}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={style}
      pointerEvents={pointerEvents}
    />
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
  overlayCompact: {
    zIndex: 10,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBackdropPressTarget: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  webOverlayBackdrop: {
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
  modalMobile: {
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  modalDepthFill: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    alignItems: "center",
    gap: 22,
  },
  modalContentMobile: {
    gap: 14,
  },
  brand: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
  },
  brandCompact: {
    fontSize: 38,
    lineHeight: 42,
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
  summaryMobile: {
    fontSize: 15,
    lineHeight: 22,
  },
  buttonStack: {
    gap: 14,
    alignItems: "center",
  },
  buttonStackMobile: {
    minHeight: 292,
    justifyContent: "center",
  },
  buttonStackSpacer: {
    width: 224,
    height: 236,
  },
  buttonStackSpacerMobile: {
    height: 292,
  },
  accessLayerSlot: {
    position: "relative",
    width: "100%",
    maxWidth: 620,
    alignItems: "center",
  },
  accessLayerSlotMobile: {
    maxWidth: 360,
  },
  accessContent: {
    position: "absolute",
    inset: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 236,
  },
  accessContentMobile: {
    minHeight: 292,
  },
  accessContentWeb: {
    transform: [{ translateY: -10 }],
  },
  accessSummarySlot: {
    height: 90,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  accessSummarySlotMobile: {
    height: 88,
  },
  accessSummary: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 27,
    textAlign: "center",
    width: "100%",
  },
  accessSummaryMobile: {
    fontSize: 17,
    lineHeight: 23,
  },
  accessSummaryAccent: {
    color: colors.accent,
  },
  accessFieldGroup: {
    width: "100%",
    maxWidth: 330,
    gap: 8,
    marginTop: 22,
  },
  accessFieldGroupMobile: {
    transform: [{ translateY: -12 }],
  },
  accessFieldGroupWeb: {
    marginTop: 10,
  },
  accessLabel: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  accessInput: {
    width: "100%",
    maxWidth: 330,
    borderWidth: 2,
    borderColor: "rgba(169, 176, 209, 0.34)",
    borderRadius: 17,
    backgroundColor: colors.panelAlt,
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 17,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingVertical: 11,
    textAlign: "center",
    ...(Platform.OS === "web"
      ? ({
          outlineColor: "rgba(169,176,209,0.92)",
          outlineStyle: "none",
          outlineWidth: 0,
        } as any)
      : null),
  },
  accessInputFocused: {
    borderColor: "rgba(169,176,209,0.92)",
    backgroundColor: "rgba(117,82,107,0.12)",
  },
  accessButtonOffset: {
    marginTop: 30,
  },
  accessButtonOffsetMobile: {
    marginTop: 18,
  },
  accessButtonOffsetWeb: {
    marginTop: 18,
  },
  accessButton: {
    borderColor: colors.textDark,
  },
  accessButtonLabel: {
    color: colors.textDark,
  },
  accessError: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
    minHeight: 16,
    textAlign: "center",
  },
  accessErrorHidden: {
    opacity: 0,
  },
});
