import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

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
  availableYears: number[];
  onNavigate: (route: ScreenRoute) => void;
  onSelectCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

export function WelcomeScreen({ countries, availableYears, onNavigate, onSelectCountry, selectedYear, onChangeYear }: Props) {
  const previewCountries = countries.slice(0, 5);
  const { width } = useWindowDimensions();
  const isStacked = width < 980;
  const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(true);

  const listColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <DiscoverySidebarPanels
        countries={previewCountries}
        selectedYear={selectedYear}
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
        activeCountryId={countries[0]?.id ?? ""}
        selectedYear={selectedYear}
        onSelectCountry={onSelectCountry}
        onOpenCountry={onSelectCountry}
        title="Globe View"
        showHeader={false}
      />
      <YearSlider year={selectedYear} years={availableYears} onChangeYear={onChangeYear} />
    </View>
  );

  return (
    <ScreenScaffold alwaysScrollableOnWeb disableScroll={isWelcomeModalVisible}>
      <View style={styles.previewStack}>
        <DiscoveryBlurb />
        <View style={[styles.previewLayout, isStacked ? styles.previewLayoutStacked : null]}>
          {isStacked ? globeColumn : listColumn}
          {isStacked ? listColumn : globeColumn}
        </View>
      </View>

      {isWelcomeModalVisible ? (
        <Pressable style={styles.overlay} onPress={() => setIsWelcomeModalVisible(false)}>
          <View style={styles.overlayBackdrop} />
          <Pressable style={styles.modalPressTarget} onPress={(event) => event.stopPropagation()}>
            <Panel style={styles.modal}>
              <Text style={styles.brand}>Hidden Gem Music</Text>
              <Text style={styles.summary}>
                Insert somewhat long text about the project and the problem and the solution
              </Text>
              <View style={styles.buttonStack}>
                <ActionButton label="Discovery Globe" size="compact" onPress={() => onNavigate("discovery")} />
                <ActionButton label="Comparison Mode" size="compact" onPress={() => onNavigate("comparisonSelect")} />
                <ActionButton label="Hidden Gems" size="compact" onPress={() => onNavigate("hiddenGems")} />
                <ActionButton label="Dashboard" size="compact" onPress={() => onNavigate("dashboard")} />
                <ActionButton label="Credits" size="compact" onPress={() => onNavigate("credits")} />
              </View>
            </Panel>
          </Pressable>
        </Pressable>
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
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22,26,38,0.56)",
  },
  modal: {
    width: "100%",
    maxWidth: 760,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(169, 176, 209, 0.24)",
    gap: 22,
  },
  modalPressTarget: {
    width: "100%",
    maxWidth: 760,
  },
  brand: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 52,
    fontWeight: "700",
    textAlign: "center",
  },
  summary: {
    color: colors.textLight,
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
