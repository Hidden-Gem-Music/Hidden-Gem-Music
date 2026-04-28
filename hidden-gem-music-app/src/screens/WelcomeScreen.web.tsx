import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Country } from "../types/content";
import { ActionButton } from "../components/ActionButton";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { DiscoverySidebarPanels } from "../components/DiscoverySidebarPanels";
import { GlobePanel } from "../components/globe/GlobePanel";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { YearSlider } from "../components/YearSlider";
import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  countries: Country[];
  onNavigate: (route: ScreenRoute) => void;
  onSelectCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

export function WelcomeScreen({ countries, onNavigate, onSelectCountry, selectedYear, onChangeYear }: Props) {
  const previewCountries = countries.slice(0, 5);
  const { width } = useWindowDimensions();
  const isStacked = width < 980;

  const listColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <DiscoverySidebarPanels
        countries={previewCountries}
        selectedCountryId={previewCountries[0]?.id}
        onSelectCountry={onSelectCountry}
        onOpenCountry={onSelectCountry}
      />
    </View>
  );

  const globeColumn = (
    <View style={[styles.rightColumn, isStacked ? styles.columnStacked : null]}>
      <GlobePanel
        countries={countries}
        activeCountryId={countries[0].id}
        onSelectCountry={onSelectCountry}
        onOpenCountry={onSelectCountry}
        title="Globe View"
        showHeader={false}
      />
      <YearSlider year={selectedYear} onChangeYear={onChangeYear} />
    </View>
  );

  return (
    <ScreenScaffold alwaysScrollableOnWeb>
      <View style={styles.previewStack}>
        <DiscoveryBlurb />
        <View style={[styles.previewLayout, isStacked ? styles.previewLayoutStacked : null]}>
          {isStacked ? globeColumn : listColumn}
          {isStacked ? listColumn : globeColumn}
        </View>
      </View>

      <View style={styles.overlay}>
        <View style={styles.overlayGradientWrap}>
          <LinearGradient
            colors={["rgba(22,26,38,0.62)", "rgba(22,26,38,0.36)", "rgba(66,72,101,0.18)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.overlayGradient}
          />
          <LinearGradient
            colors={["rgba(117,82,107,0.16)", "rgba(117,82,107,0.05)", "rgba(117,82,107,0.00)"]}
            start={{ x: 0.0, y: 0.04 }}
            end={{ x: 1.0, y: 0.72 }}
            style={styles.overlayGradient}
          />
          <LinearGradient
            colors={["rgba(108,119,142,0.16)", "rgba(108,119,142,0.05)", "rgba(108,119,142,0.00)"]}
            start={{ x: 1.0, y: 0.0 }}
            end={{ x: 0.08, y: 0.94 }}
            style={styles.overlayGradient}
          />
        </View>
        <Panel style={styles.modal}>
          <Text style={styles.brand}>Hidden Gem Music</Text>
          <Text style={styles.summary}>
            Insert somewhat long text about the project and the problem and the solution
          </Text>
          <View style={styles.buttonStack}>
            <ActionButton label="Discovery Globe" size="compact" onPress={() => onNavigate("discovery")} />
            <ActionButton label="Comparison Mode" size="compact" onPress={() => onNavigate("comparisonSelect")} />
            <ActionButton label="Hidden Songs" size="compact" onPress={() => onNavigate("hiddenGems")} />
            <ActionButton label="Dashboard" size="compact" onPress={() => onNavigate("dashboard")} />
            <ActionButton label="Credits" size="compact" onPress={() => onNavigate("credits")} />
          </View>
        </Panel>
      </View>
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
  columnStacked: {
    width: "100%",
    minWidth: 0,
  },
  overlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  overlayGradientWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    width: "100%",
    maxWidth: 760,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.panel,
    gap: 22,
  },
  brand: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 52,
    fontWeight: "700",
    textAlign: "center",
  },
  summary: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 28,
    textAlign: "center",
    maxWidth: 620,
  },
  buttonStack: {
    gap: 14,
    alignItems: "center",
  },
});
