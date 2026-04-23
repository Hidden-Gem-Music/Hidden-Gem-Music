import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Country } from "../types/content";
import { CountryCard } from "../components/CountryCard";
import { FilterBar, presetFilters } from "../components/FilterBar";
import { GlobePanel } from "../components/globe/GlobePanel";
import { ListViewPanel } from "../components/ListViewPanel";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { YearSlider } from "../components/YearSlider";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  countries: Country[];
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

export function DiscoveryScreen({
  countries,
  selectedCountryId,
  onSelectCountry,
  onOpenCountry,
  selectedYear,
  onChangeYear,
}: Props) {
  // Issue #6 shell: this screen owns the core Discovery Globe layout,
  // including globe rendering, country selection, panel structure, and dummy-data wiring.
  const { width } = useWindowDimensions();
  const isStacked = width < 980;
  const [listScrollSignal, setListScrollSignal] = useState(0);
  const [activeFilter, setActiveFilter] = useState<(typeof presetFilters)[number] | null>(null);
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);

  const handleGlobeFocus = (countryId: string) => {
    onSelectCountry(countryId);
    setListScrollSignal((current) => current + 1);
  };

  const listColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <ListViewPanel
        subtitle={"Select a country, use Comparison Mode,\nor the Dashboard to discover more."}
        itemIds={countries.map((country) => country.id)}
        selectedItemId={selectedCountryId}
        subtitleRight
        autoScrollSignal={listScrollSignal}
      >
        {countries.map((country) => (
          <CountryCard
            key={country.id}
            country={country}
            selected={country.id === selectedCountryId}
            onHover={() => onSelectCountry(country.id)}
            onTitlePress={() => onOpenCountry(country.id)}
            onPress={() => {
              onSelectCountry(country.id);
              onOpenCountry(country.id);
            }}
          />
        ))}
      </ListViewPanel>
    </View>
  );

  const globeColumn = (
    <View style={[styles.rightColumn, isStacked ? styles.columnStacked : null]}>
      <GlobePanel
        countries={countries}
        activeCountryId={selectedCountryId}
        onSelectCountry={handleGlobeFocus}
        onOpenCountry={onOpenCountry}
        title="Globe View"
        subtitle={"Hover over gems to view that country,\nor click to view the country page."}
      />
      <YearSlider year={selectedYear} onChangeYear={onChangeYear} />
    </View>
  );

  return (
    <ScreenScaffold>
      <FilterBar
        activeFilter={activeFilter}
        onSelectFilter={(filter) => {
          setAllFiltersOpen(false);
          setActiveFilter((current) => (current === filter ? null : filter));
        }}
        onOpenAllFilters={() => setAllFiltersOpen(true)}
      />
      <View style={[styles.layout, isStacked ? styles.layoutStacked : null]}>
        {isStacked ? globeColumn : listColumn}
        {isStacked ? listColumn : globeColumn}
      </View>

      {/* Issue #6 follow-up area: this modal shell is in place now and will take the
          chart/filter-related UI refinements discussed after the April 21 meeting. */}
      {allFiltersOpen ? (
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Filters</Text>
              <Pressable onPress={() => setAllFiltersOpen(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>
          </Panel>
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: "row",
    gap: 24,
    flexWrap: "wrap",
  },
  layoutStacked: {
    flexDirection: "column",
  },
  leftColumn: {
    flex: 1,
    minWidth: 340,
    gap: 16,
  },
  rightColumn: {
    flex: 1,
    minWidth: 340,
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
    minHeight: 360,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.panel,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  modalTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 48,
    fontWeight: "700",
  },
  modalClose: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 18,
  },
});
