import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Country } from "../types/content";
import { ActionButton } from "../components/ActionButton";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { DiscoverySidebarPanels } from "../components/DiscoverySidebarPanels";
import { GlobePanel } from "../components/globe/GlobePanel";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { YearSlider } from "../components/YearSlider";
import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  countries: Country[];
  availableYears: number[];
  onNavigate: (route: ScreenRoute) => void;
  onSelectCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
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
  const value = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

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

  return `#${channelToHex(mix(start.r, end.r))}${channelToHex(mix(start.g, end.g))}${channelToHex(mix(start.b, end.b))}`;
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
        const color = progress <= 0.14
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

function WelcomeYearDropdown({
  selectedYear,
  years,
  onChangeYear,
}: {
  selectedYear: number;
  years: number[];
  onChangeYear: (year: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState(false);
  const [pressedButton, setPressedButton] = useState(false);
  const showButtonGradient = open || hoveredButton || pressedButton;

  return (
    <View style={styles.mobileYearDropdownWrap}>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        onHoverIn={() => setHoveredButton(true)}
        onHoverOut={() => setHoveredButton(false)}
        onPressIn={() => setPressedButton(true)}
        onPressOut={() => setPressedButton(false)}
        style={styles.mobileYearDropdownShell}
      >
        {showButtonGradient ? (
          <LinearGradient
            colors={pressedButton ? activeGradient : ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"]}
            locations={[0, 0.34, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.mobileYearDropdownGradient}
          />
        ) : null}
        <View style={[styles.mobileYearDropdownButton, showButtonGradient ? styles.mobileYearDropdownButtonActive : null]}>
          <Text style={[styles.mobileYearDropdownText, showButtonGradient ? styles.mobileYearDropdownTextActive : null]}>
            {selectedYear}
          </Text>
          <Text style={[styles.mobileYearDropdownChevron, showButtonGradient ? styles.mobileYearDropdownTextActive : null]}>
            {open ? "-" : "+"}
          </Text>
        </View>
      </Pressable>
      {open ? (
        <Panel style={styles.mobileYearDropdownMenu}>
          <SecondarySurfaceFill />
          <ScrollView style={styles.mobileYearDropdownScroll} contentContainerStyle={styles.mobileYearDropdownContent}>
            {years.slice().sort((a, b) => b - a).map((yearOption) => {
              const active = yearOption === selectedYear;
              const hovered = hoveredYear === yearOption;
              const showOptionGradient = active || hovered;
              return (
                <Pressable
                  key={`welcome-year-${yearOption}`}
                  onHoverIn={() => setHoveredYear(yearOption)}
                  onHoverOut={() => setHoveredYear((current) => (current === yearOption ? null : current))}
                  onPress={() => {
                    onChangeYear(yearOption);
                    setOpen(false);
                  }}
                  style={styles.mobileYearDropdownOptionShell}
                >
                  {showOptionGradient ? (
                    <LinearGradient
                      colors={active ? activeGradient : ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"]}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.mobileYearDropdownGradient}
                    />
                  ) : null}
                  <View style={[styles.mobileYearDropdownOption, showOptionGradient ? styles.mobileYearDropdownOptionActive : null]}>
                    <Text style={[styles.mobileYearDropdownOptionText, showOptionGradient ? styles.mobileYearDropdownTextActive : null]}>
                      {yearOption}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Panel>
      ) : null}
    </View>
  );
}

export function WelcomeScreen({ countries, availableYears, onNavigate, onSelectCountry, selectedYear, onChangeYear }: Props) {
  const previewCountries = useMemo(() => countries.slice(0, 5), [countries]);
  const { width } = useWindowDimensions();
  const isStacked = width < 980;
  const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(true);
  const [isWelcomeModalClosing, setIsWelcomeModalClosing] = useState(false);
  const [isWelcomeInteractionCooldown, setIsWelcomeInteractionCooldown] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewInteractionsDisabled = isWelcomeModalVisible || isWelcomeModalClosing || isWelcomeInteractionCooldown;
  const dismissWelcomeModal = (navigateToDiscovery = false) => {
    if (isWelcomeModalClosing || !isWelcomeModalVisible) {
      return;
    }

    setIsWelcomeModalClosing(true);
    setIsWelcomeInteractionCooldown(true);
    const closeDelay = Platform.OS === "web" ? 120 : 90;
    closeTimerRef.current = globalThis.setTimeout(() => {
      setIsWelcomeModalVisible(false);
      setIsWelcomeModalClosing(false);
      if (navigateToDiscovery) {
        onNavigate("discovery");
      }
    }, closeDelay);
    cooldownTimerRef.current = globalThis.setTimeout(() => {
      setIsWelcomeInteractionCooldown(false);
    }, 650);
  };
  const navigateFromWelcomeModal = (route: ScreenRoute) => {
    if (route === "discovery") {
      dismissWelcomeModal(true);
      return;
    }

    if (isWelcomeModalClosing) {
      return;
    }

    setIsWelcomeModalClosing(true);
    setIsWelcomeInteractionCooldown(true);
    const closeDelay = Platform.OS === "web" ? 120 : 90;
    closeTimerRef.current = globalThis.setTimeout(() => {
      setIsWelcomeModalVisible(false);
      setIsWelcomeModalClosing(false);
      onNavigate(route);
    }, closeDelay);
    cooldownTimerRef.current = globalThis.setTimeout(() => {
      setIsWelcomeInteractionCooldown(false);
    }, 650);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const listColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <DiscoverySidebarPanels
        countries={previewCountries}
        selectedYear={selectedYear}
        selectedCountryId={previewCountries[0]?.id}
        onSelectCountry={previewInteractionsDisabled ? () => {} : onSelectCountry}
        onOpenCountry={previewInteractionsDisabled ? () => {} : onSelectCountry}
      />
    </View>
  );

  const globeColumn = (
    <View style={[styles.rightColumn, isStacked ? styles.columnStacked : null]}>
      <View style={styles.globePanelWrap}>
        <GlobePanel
          countries={countries}
          activeCountryId={countries[0]?.id ?? ""}
          selectedYear={selectedYear}
          onSelectCountry={previewInteractionsDisabled ? () => {} : onSelectCountry}
          onOpenCountry={previewInteractionsDisabled ? () => {} : onSelectCountry}
          title="Globe View"
          rightActionLabel="All Filters"
          onRightAction={previewInteractionsDisabled ? () => {} : () => onNavigate("discovery")}
          showHeader={false}
        />
        {isStacked ? (
          <View style={styles.mobileYearDropdownOverlay}>
            <WelcomeYearDropdown
              selectedYear={selectedYear}
              years={availableYears}
              onChangeYear={previewInteractionsDisabled ? () => {} : onChangeYear}
            />
          </View>
        ) : (
          <YearSlider year={selectedYear} years={availableYears} onChangeYear={previewInteractionsDisabled ? () => {} : onChangeYear} />
        )}
      </View>
    </View>
  );

  return (
    <ScreenScaffold alwaysScrollableOnWeb disableScroll={isWelcomeModalVisible || isWelcomeModalClosing}>
      <View style={styles.previewStack} pointerEvents={isWelcomeModalVisible || isWelcomeModalClosing ? "none" : "auto"}>
        <DiscoveryBlurb />
        <View style={[styles.previewLayout, isStacked ? styles.previewLayoutStacked : null]}>
          {isStacked ? globeColumn : listColumn}
          {isStacked ? listColumn : globeColumn}
        </View>
      </View>

      {isWelcomeModalVisible || isWelcomeModalClosing ? (
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
              dismissWelcomeModal(true);
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
                  The purpose of this app is to find and display the 'Discovery Gap' — What music is most loved in
                  each country, and how much was that country's most loved music spread, shared, and loved by other
                  countries? Explore the Discovery Gap multiple ways: the discovery globe, country detail pages,
                  comparison mode, listen to 30 second previews of hidden gems, and the discovery dashboard (name
                  TBD). Utilize filters in multiple areas of the app to fine tune your discovery.
                </Text>
                <View style={styles.buttonStack}>
                  <ActionButton label="Discovery Globe" size="compact" onPress={() => navigateFromWelcomeModal("discovery")} />
                  <ActionButton label="Comparison Mode" size="compact" onPress={() => navigateFromWelcomeModal("comparisonSelect")} />
                  <ActionButton label="Hidden Gems" size="compact" onPress={() => navigateFromWelcomeModal("hiddenGems")} />
                  <ActionButton label="Dashboard" size="compact" onPress={() => navigateFromWelcomeModal("dashboard")} />
                  <ActionButton label="Credits" size="compact" onPress={() => navigateFromWelcomeModal("credits")} />
                </View>
              </View>
            </Panel>
          </Pressable>
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  previewStack: {
    gap: 24,
  },
  previewLayout: {
    flexDirection: "row",
    gap: 24,
    flexWrap: "wrap",
    opacity: 0.95,
  },
  previewLayoutStacked: {
    flexDirection: "column",
  },
  leftColumn: {
    flex: 1,
    minWidth: 320,
    gap: 16,
  },
  rightColumn: {
    flex: 1,
    minWidth: 320,
    gap: 18,
  },
  globePanelWrap: {
    position: "relative",
  },
  mobileYearDropdownOverlay: {
    position: "absolute",
    top: 14,
    right: 186,
    zIndex: 12,
  },
  columnStacked: {
    width: "100%",
    minWidth: 0,
  },
  mobileYearDropdownWrap: {
    position: "relative",
    zIndex: 30,
  },
  mobileYearDropdownShell: {
    borderRadius: 14,
    overflow: "hidden",
  },
  mobileYearDropdownGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  mobileYearDropdownButton: {
    minHeight: 40,
    minWidth: 108,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  mobileYearDropdownButtonActive: {
    backgroundColor: "transparent",
  },
  mobileYearDropdownText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    lineHeight: 18,
  },
  mobileYearDropdownTextActive: {
    color: colors.textLight,
  },
  mobileYearDropdownChevron: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 22,
    lineHeight: 22,
  },
  mobileYearDropdownMenu: {
    position: "absolute",
    top: 46,
    right: 0,
    width: 120,
    maxHeight: 250,
    padding: 0,
    overflow: "hidden",
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: "transparent",
  },
  mobileYearDropdownScroll: {
    maxHeight: 250,
  },
  mobileYearDropdownContent: {
    padding: 8,
    gap: 8,
  },
  mobileYearDropdownOptionShell: {
    borderRadius: 12,
    overflow: "hidden",
  },
  mobileYearDropdownOption: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  mobileYearDropdownOptionActive: {
    backgroundColor: "transparent",
  },
  mobileYearDropdownOptionText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
  },
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
  modalPressTarget: {
    width: "100%",
    maxWidth: 760,
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
