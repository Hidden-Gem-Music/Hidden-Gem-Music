import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";

import { Country } from "../types/content";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { DiscoverySidebarPanels } from "../components/DiscoverySidebarPanels";
import { GlobePanel } from "../components/globe/GlobePanel";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { YearSlider } from "../components/YearSlider";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
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
  const { width, height } = useWindowDimensions();
  const isStacked = width < 980;
  const allowShortViewportHorizontalScroll = Platform.OS === "web" && !isStacked && height < 860;
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  const [listAutoScrollSignal, setListAutoScrollSignal] = useState(0);

  const handleGlobeFocus = (countryId: string) => {
    onSelectCountry(countryId);
    setListAutoScrollSignal((current) => current + 1);
  };

  const listColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <DiscoverySidebarPanels
        countries={countries}
        selectedCountryId={selectedCountryId}
        onSelectCountry={onSelectCountry}
        onOpenCountry={onOpenCountry}
        autoScrollSignal={listAutoScrollSignal}
      />
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
        onRightAction={() => setAllFiltersOpen(true)}
        showHeader={false}
      />
      <YearSlider year={selectedYear} onChangeYear={onChangeYear} />
    </View>
  );

  const discoveryContent = (
    <View style={[styles.discoveryStack, allowShortViewportHorizontalScroll ? styles.discoveryStackScrollable : null]}>
      {/*
      <FilterBar
        activeFilter={activeFilter}
        onSelectFilter={(filter) => {
          setAllFiltersOpen(false);
          setActiveFilter((current) => (current === filter ? null : filter));
        }}
        onOpenAllFilters={() => setAllFiltersOpen(true)}
      />
      */}
      <DiscoveryBlurb />
      <View
        style={[
          styles.layout,
          isStacked ? styles.layoutStacked : null,
          allowShortViewportHorizontalScroll ? styles.layoutScrollable : null,
        ]}
      >
        {isStacked ? globeColumn : listColumn}
        {isStacked ? listColumn : globeColumn}
      </View>
    </View>
  );

  return (
    <ScreenScaffold>
      {allowShortViewportHorizontalScroll ? (
        <ScrollView
          horizontal
          style={styles.horizontalScroll}
          contentContainerStyle={styles.horizontalScrollContent}
          showsHorizontalScrollIndicator={false}
          alwaysBounceHorizontal={false}
        >
          {discoveryContent}
        </ScrollView>
      ) : (
        discoveryContent
      )}

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
  horizontalScroll: {
    width: "100%",
    ...(Platform.OS === "web"
      ? ({
          overflowX: "auto",
          overflowY: "visible",
          scrollbarWidth: "none",
        } as ViewStyle)
      : null),
  },
  horizontalScrollContent: {
    minWidth: "100%",
  },
  discoveryStack: {
    gap: 16,
    marginTop: -8,
  },
  discoveryStackScrollable: {
    minWidth: 1040,
  },
  layout: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  layoutStacked: {
    flexDirection: "column",
  },
  layoutScrollable: {
    flexWrap: "nowrap",
  },
  leftColumn: {
    flex: 1,
    minWidth: 340,
    gap: 16,
  },
  rightColumn: {
    flex: 1,
    minWidth: 340,
    gap: 16,
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
