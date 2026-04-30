import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";

import { Country } from "../types/content";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { DiscoverySidebarPanels } from "../components/DiscoverySidebarPanels";
import { GemIcon } from "../components/GemIcon";
import { GlobePanel } from "../components/globe/GlobePanel";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
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

type SortOption = "a-z" | "z-a" | "gems-desc" | "gems-asc";
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const normalizeContinent = (region: string) => {
  if (region === "Continent info coming soon.") {
    return "Unknown / Missing";
  }
  if (region === "Other") {
    return "Other / Territories";
  }
  return region;
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
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  const [listAutoScrollSignal, setListAutoScrollSignal] = useState(0);
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  const [selectedContinents, setSelectedContinents] = useState<string[]>([]);
  const [onlyWithHiddenGems, setOnlyWithHiddenGems] = useState(true);
  const [onlyWithoutHiddenGems, setOnlyWithoutHiddenGems] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isClosePressed, setIsClosePressed] = useState(false);

  const continentOptions = useMemo(() => {
    const continents = Array.from(
      new Set(countries.map((country) => normalizeContinent(country.region)).filter(Boolean))
    ).sort((a, b) =>
      a.localeCompare(b)
    );
    return ["all", ...continents];
  }, [countries]);

  const filteredCountries = useMemo(() => {
    let next = [...countries];

    if (selectedContinents.length > 0) {
      const continentSet = new Set(selectedContinents);
      next = next.filter((country) => continentSet.has(normalizeContinent(country.region)));
    }

    if (onlyWithHiddenGems) {
      next = next.filter((country) => country.hiddenSongs > 0);
    }
    if (onlyWithoutHiddenGems) {
      next = next.filter((country) => country.hiddenSongs <= 0);
    }

    if (sortOption) {
      next.sort((a, b) => {
        switch (sortOption) {
          case "a-z":
            return a.name.localeCompare(b.name);
          case "z-a":
            return b.name.localeCompare(a.name);
          case "gems-desc":
            return b.hiddenSongs - a.hiddenSongs || a.name.localeCompare(b.name);
          case "gems-asc":
            return a.hiddenSongs - b.hiddenSongs || a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
    }

    return next;
  }, [countries, onlyWithHiddenGems, onlyWithoutHiddenGems, selectedContinents, sortOption]);

  const visibleSelectedCountryId = filteredCountries.some((country) => country.id === selectedCountryId)
    ? selectedCountryId
    : filteredCountries[0]?.id ?? selectedCountryId;

  const handleGlobeFocus = (countryId: string) => {
    onSelectCountry(countryId);
    setListAutoScrollSignal((current) => current + 1);
  };

  const listColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <DiscoverySidebarPanels
        countries={filteredCountries}
        selectedYear={selectedYear}
        selectedCountryId={visibleSelectedCountryId}
        onSelectCountry={onSelectCountry}
        onOpenCountry={onOpenCountry}
        autoScrollSignal={listAutoScrollSignal}
      />
    </View>
  );

  const globeColumn = (
    <View style={[styles.rightColumn, isStacked ? styles.columnStacked : null]}>
      <GlobePanel
        countries={filteredCountries}
        activeCountryId={visibleSelectedCountryId}
        selectedYear={selectedYear}
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
    <ScrollView
      nativeID="discovery-page-scroll"
      style={styles.pageScroll}
      contentContainerStyle={styles.discoveryStack}
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical={false}
    >
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
      <View style={[styles.layout, isStacked ? styles.layoutStacked : null]}>
        {isStacked ? globeColumn : listColumn}
        {isStacked ? listColumn : globeColumn}
      </View>
    </ScrollView>
  );

  return (
    <ScreenScaffold contentStyle={styles.scaffoldContent}>
      {discoveryContent}

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
              <Pressable
                onPress={() => setAllFiltersOpen(false)}
                onHoverIn={() => setIsCloseHovered(true)}
                onHoverOut={() => setIsCloseHovered(false)}
                onPressIn={() => setIsClosePressed(true)}
                onPressOut={() => setIsClosePressed(false)}
                style={styles.closeButtonShell}
              >
                {isCloseHovered || isClosePressed ? (
                  <LinearGradient
                    colors={isClosePressed ? activeGradient : ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"]}
                    locations={[0, 0.34, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.closeButtonGradient}
                  />
                ) : null}
                <View style={[styles.closeButton, isCloseHovered || isClosePressed ? styles.closeButtonActive : null]}>
                  <Text style={[styles.closeButtonText, isCloseHovered || isClosePressed ? styles.closeButtonTextActive : null]}>
                    Close
                  </Text>
                </View>
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.filtersPanelStack}
              showsVerticalScrollIndicator={false}
            >
              <Panel style={styles.filterSection}>
                <SecondarySurfaceFill />
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.optionGroup}>
                  <Pressable style={styles.filterButtonShell} onPress={() => setSortOption((current) => (current === "a-z" ? null : "a-z"))}>
                    {sortOption === "a-z" ? <LinearGradient colors={activeGradient} locations={[0, 0.34, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.filterButtonGradient} /> : null}
                    <View style={[styles.filterButton, sortOption === "a-z" ? styles.filterButtonActive : null]}>
                      <View style={styles.filterButtonContent}>
                        <View style={styles.filterButtonLead}>
                          <GemIcon size={16} />
                          <Text style={[styles.filterButtonText, sortOption === "a-z" ? styles.filterButtonTextActive : null]}>A--Z</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable style={styles.filterButtonShell} onPress={() => setSortOption((current) => (current === "z-a" ? null : "z-a"))}>
                    {sortOption === "z-a" ? <LinearGradient colors={activeGradient} locations={[0, 0.34, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.filterButtonGradient} /> : null}
                    <View style={[styles.filterButton, sortOption === "z-a" ? styles.filterButtonActive : null]}>
                      <View style={styles.filterButtonContent}>
                        <View style={styles.filterButtonLead}>
                          <GemIcon size={16} />
                          <Text style={[styles.filterButtonText, sortOption === "z-a" ? styles.filterButtonTextActive : null]}>Z--A</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable style={styles.filterButtonShell} onPress={() => setSortOption((current) => (current === "gems-desc" ? null : "gems-desc"))}>
                    {sortOption === "gems-desc" ? <LinearGradient colors={activeGradient} locations={[0, 0.34, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.filterButtonGradient} /> : null}
                    <View style={[styles.filterButton, sortOption === "gems-desc" ? styles.filterButtonActive : null]}>
                      <View style={styles.filterButtonContent}>
                        <View style={styles.filterButtonLead}>
                          <GemIcon size={16} />
                          <Text style={[styles.filterButtonText, sortOption === "gems-desc" ? styles.filterButtonTextActive : null]}>
                            Most Hidden Gems to Least
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable style={styles.filterButtonShell} onPress={() => setSortOption((current) => (current === "gems-asc" ? null : "gems-asc"))}>
                    {sortOption === "gems-asc" ? <LinearGradient colors={activeGradient} locations={[0, 0.34, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.filterButtonGradient} /> : null}
                    <View style={[styles.filterButton, sortOption === "gems-asc" ? styles.filterButtonActive : null]}>
                      <View style={styles.filterButtonContent}>
                        <View style={styles.filterButtonLead}>
                          <GemIcon size={16} />
                          <Text style={[styles.filterButtonText, sortOption === "gems-asc" ? styles.filterButtonTextActive : null]}>
                            Least Hidden Gems to Most
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.filterButtonShell}
                    onPress={() =>
                      setOnlyWithHiddenGems((current) => {
                        const next = !current;
                        if (next) {
                          setOnlyWithoutHiddenGems(false);
                        }
                        return next;
                      })
                    }
                  >
                    {onlyWithHiddenGems ? <LinearGradient colors={activeGradient} locations={[0, 0.34, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.filterButtonGradient} /> : null}
                    <View style={[styles.filterButton, onlyWithHiddenGems ? styles.filterButtonActive : null]}>
                      <View style={styles.filterButtonContent}>
                        <View style={styles.filterButtonLead}>
                          <GemIcon size={16} />
                          <Text style={[styles.filterButtonText, onlyWithHiddenGems ? styles.filterButtonTextActive : null]}>
                            Only Show Countries with Hidden Gems
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.filterButtonShell}
                    onPress={() =>
                      setOnlyWithoutHiddenGems((current) => {
                        const next = !current;
                        if (next) {
                          setOnlyWithHiddenGems(false);
                        }
                        return next;
                      })
                    }
                  >
                    {onlyWithoutHiddenGems ? <LinearGradient colors={activeGradient} locations={[0, 0.34, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.filterButtonGradient} /> : null}
                    <View style={[styles.filterButton, onlyWithoutHiddenGems ? styles.filterButtonActive : null]}>
                      <View style={styles.filterButtonContent}>
                        <View style={styles.filterButtonLead}>
                          <GemIcon size={16} />
                          <Text style={[styles.filterButtonText, onlyWithoutHiddenGems ? styles.filterButtonTextActive : null]}>
                            Show Countries Without Hidden Gems
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </View>
              </Panel>

              <Panel style={styles.filterSection}>
                <SecondarySurfaceFill />
                <Text style={styles.filterSectionTitle}>Continent</Text>
                <View style={styles.optionGroup}>
                  {continentOptions.map((continentOption) => {
                    const isActive =
                      continentOption === "all"
                        ? selectedContinents.length === 0
                        : selectedContinents.includes(continentOption);
                    const label = continentOption === "all" ? "All Continents" : continentOption;
                    return (
                      <Pressable
                        key={continentOption}
                        style={styles.filterButtonShell}
                        onPress={() => {
                          if (continentOption === "all") {
                            setSelectedContinents([]);
                            return;
                          }

                          setSelectedContinents((current) =>
                            current.includes(continentOption)
                              ? current.filter((continent) => continent !== continentOption)
                              : [...current, continentOption]
                          );
                        }}
                      >
                        {isActive ? <LinearGradient colors={activeGradient} locations={[0, 0.34, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.filterButtonGradient} /> : null}
                        <View style={[styles.filterButton, isActive ? styles.filterButtonActive : null]}>
                          <View style={styles.filterButtonContent}>
                            <View style={styles.filterButtonLead}>
                              <GemIcon size={16} />
                              <Text style={[styles.filterButtonText, isActive ? styles.filterButtonTextActive : null]}>{label}</Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Panel>
            </ScrollView>
          </Panel>
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  pageScroll: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
          scrollbarWidth: "none",
          outlineStyle: "none",
          outlineWidth: 0,
        } as unknown as ViewStyle)
      : null),
  },
  scaffoldContent: {
    padding: 0,
    gap: 0,
  },
  discoveryStack: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  layout: {
    flexDirection: "row",
    gap: 16,
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
    maxWidth: 660,
    maxHeight: "82%",
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: colors.panel,
    gap: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(169, 176, 209, 0.24)",
    overflow: "hidden",
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
    fontSize: 30,
    fontWeight: "700",
  },
  closeButtonShell: {
    borderRadius: 12,
    overflow: "hidden",
  },
  closeButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    minHeight: 42,
    minWidth: 110,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonActive: {
    backgroundColor: "transparent",
  },
  closeButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  closeButtonTextActive: {
    color: colors.text,
  },
  modalScroll: {
    flex: 1,
    minHeight: 0,
  },
  filtersPanelStack: {
    gap: 14,
    paddingBottom: 8,
  },
  filterSection: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(169, 176, 209, 0.18)",
  },
  filterSectionTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 22,
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "flex-start",
  },
  filterButtonShell: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  filterButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  filterButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "transparent",
  },
  filterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  filterButtonLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  filterButtonText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
    textAlign: "left",
    flexShrink: 1,
  },
  filterButtonTextActive: {
    color: colors.text,
  },
});
