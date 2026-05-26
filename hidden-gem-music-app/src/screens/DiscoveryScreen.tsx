import { LinearGradient } from "expo-linear-gradient";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { YearDataDisclaimer } from "../components/YearDataDisclaimer";
import { useMobileExperience } from "../config/discoveryMode";
import { loadCountryGenreSamples, loadCountryLanguageSamples } from "../data/countryApi";
import { formatLanguageAndMore } from "../data/languageApi";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  isActive?: boolean;
  isLoading?: boolean;
  countries: Country[];
  allYearsCountries?: Country[];
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
  availableYears?: number[];
};

type SortOption = "a-z" | "z-a" | "gems-desc" | "gems-asc";
const initialDiscoverySamplePrefetchCount = 24;
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const popupBottomDepthGradient = ["rgba(108,119,142,0)", "rgba(108,119,142,0.12)", "rgba(108,119,142,0.3)"] as const;
const normalizeContinent = (region: string) => {
  if (region === "Continent info coming soon.") {
    return "Unknown / Missing";
  }
  if (region === "Other") {
    return "Other / Territories";
  }
  return region;
};

function formatGenreSummary(genres: string[]) {
  const cleaned = genres
    .map((genre) => genre.trim())
    .filter((genre) => genre.length > 0 && genre.toLowerCase() !== "unknown" && genre.toLowerCase() !== "loading...");
  if (cleaned.length >= 3) {
    return `${cleaned[0]}, ${cleaned[1]}, ${cleaned[2]}, and others`;
  }

  if (cleaned.length === 2) {
    return `${cleaned[0]}, ${cleaned[1]}`;
  }

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  return "";
}

export function DiscoveryScreen({
  isActive = true,
  isLoading = false,
  countries,
  allYearsCountries,
  selectedCountryId,
  onSelectCountry,
  onOpenCountry,
  selectedYear,
  onChangeYear,
  availableYears,
}: Props) {
  // Issue #6 shell: this screen owns the core Discovery Map layout,
  // including map rendering, country selection, panel structure, and dummy-data wiring.
  const { width } = useWindowDimensions();
  const isMobileExperience = useMobileExperience();
  const isStacked = isMobileExperience || width < 980;
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  const [listAutoScrollSignal, setListAutoScrollSignal] = useState(0);
  const [hoveredListCountryId, setHoveredListCountryId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  const [selectedContinents, setSelectedContinents] = useState<string[]>([]);
  const [onlyWithHiddenGems, setOnlyWithHiddenGems] = useState(true);
  const [onlyWithoutHiddenGems, setOnlyWithoutHiddenGems] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isClosePressed, setIsClosePressed] = useState(false);
  const [isClearHovered, setIsClearHovered] = useState(false);
  const [isClearPressed, setIsClearPressed] = useState(false);
  const [selectedFilterYears, setSelectedFilterYears] = useState<number[]>([selectedYear]);
  const [genrePrefetchCount, setGenrePrefetchCount] = useState(initialDiscoverySamplePrefetchCount);
  const [genreSummaryByCountryCode, setGenreSummaryByCountryCode] = useState<Record<string, string>>({});
  const [languageSummaryByCountryCode, setLanguageSummaryByCountryCode] = useState<Record<string, string>>({});
  const [languageLoadingByCountryCode, setLanguageLoadingByCountryCode] = useState<Record<string, boolean>>({});
  const genreRequestControllersRef = useRef<AbortController[]>([]);
  const requestedGenreCodesRef = useRef<Set<string>>(new Set());
  const languageRequestControllersRef = useRef<AbortController[]>([]);
  const requestedLanguageCodesRef = useRef<Set<string>>(new Set());
  const timelineYears =
    availableYears && availableYears.length > 0
      ? Array.from(new Set([...availableYears, selectedYear])).sort((a, b) => a - b)
      : [selectedYear];
  const isAllYearsSelected = selectedFilterYears.length === 0;
  const countriesForFiltering =
    isAllYearsSelected && allYearsCountries && allYearsCountries.length > 0
      ? allYearsCountries
      : countries;

  useEffect(() => {
    if (!isActive) {
      setAllFiltersOpen(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (isAllYearsSelected) {
      return;
    }

    if (selectedFilterYears[0] !== selectedYear) {
      setSelectedFilterYears([selectedYear]);
    }
  }, [isAllYearsSelected, selectedFilterYears, selectedYear]);

  const resetAllFilters = () => {
    setSortOption(null);
    setSelectedContinents([]);
    setOnlyWithHiddenGems(true);
    setOnlyWithoutHiddenGems(false);
    setSelectedFilterYears([]);
  };

  const continentOptions = useMemo(() => {
    const continents = Array.from(
      new Set(countriesForFiltering.map((country) => normalizeContinent(country.region)).filter(Boolean))
    ).sort((a, b) =>
      a.localeCompare(b)
    );
    return ["all", ...continents];
  }, [countriesForFiltering]);

  const filteredCountries = useMemo(() => {
    let next = [...countriesForFiltering];

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
  }, [countriesForFiltering, onlyWithHiddenGems, onlyWithoutHiddenGems, selectedContinents, sortOption]);

  const visibleSelectedCountryId = filteredCountries.some((country) => country.id === selectedCountryId)
    ? selectedCountryId
    : filteredCountries[0]?.id ?? selectedCountryId;
  const visibleSelectedCountryCode = filteredCountries.find((country) => country.id === visibleSelectedCountryId)?.code;
  const displayGenreSummaryByCountryCode = useMemo(() => {
    const next: Record<string, string> = {};
    filteredCountries.forEach((country) => {
      const loadedSummary = genreSummaryByCountryCode[country.code];
      const localSummary = formatGenreSummary(country.genres ?? []);
      if (loadedSummary || localSummary) {
        next[country.code] = loadedSummary || localSummary;
      }
    });
    return next;
  }, [filteredCountries, genreSummaryByCountryCode]);

  const ensureCountryGenreSamples = useCallback(
    (countryCodes: string[]) => {
      if (!isActive) {
        return;
      }

      const nextCodes = Array.from(
        new Set(
          countryCodes
            .map((code) => code.trim().toUpperCase())
            .filter((code) => code.length === 2)
            .filter((code) => !displayGenreSummaryByCountryCode[code])
            .filter((code) => !requestedGenreCodesRef.current.has(code))
        )
      );

      if (nextCodes.length === 0) {
        return;
      }

      nextCodes.forEach((code) => requestedGenreCodesRef.current.add(code));

      const controller = new AbortController();
      genreRequestControllersRef.current.push(controller);

      loadCountryGenreSamples(nextCodes, selectedYear, controller.signal)
        .then((payload) => {
          if (controller.signal.aborted || !isActive) {
            return;
          }

          setGenreSummaryByCountryCode((current) => {
            const next = { ...current };
            payload.forEach((item) => {
              const summary = formatGenreSummary(Array.isArray(item.genres) ? item.genres : []);
              next[item.countryCode] = summary || "Unknown";
            });
            return next;
          });
        })
        .catch((error) => {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }
          nextCodes.forEach((code) => requestedGenreCodesRef.current.delete(code));
          console.warn(`Failed loading discovery genre samples for ${selectedYear}.`, error);
        })
        .finally(() => {
          if (controller.signal.aborted || !isActive) {
            genreRequestControllersRef.current = genreRequestControllersRef.current.filter((entry) => entry !== controller);
            return;
          }

          genreRequestControllersRef.current = genreRequestControllersRef.current.filter((entry) => entry !== controller);
        });
    },
    [displayGenreSummaryByCountryCode, isActive, selectedYear]
  );

  const ensureCountryLanguageSamples = useCallback(
    (countryCodes: string[]) => {
      if (!isActive) {
        return;
      }

      const nextCodes = Array.from(
        new Set(
          countryCodes
            .map((code) => code.trim().toUpperCase())
            .filter((code) => code.length === 2)
            .filter((code) => !languageSummaryByCountryCode[code])
            .filter((code) => !requestedLanguageCodesRef.current.has(code))
        )
      );

      if (nextCodes.length === 0) {
        return;
      }

      nextCodes.forEach((code) => requestedLanguageCodesRef.current.add(code));
      setLanguageLoadingByCountryCode((current) => {
        const next = { ...current };
        nextCodes.forEach((code) => {
          next[code] = true;
        });
        return next;
      });

      const controller = new AbortController();
      languageRequestControllersRef.current.push(controller);

      loadCountryLanguageSamples(nextCodes, selectedYear, controller.signal)
        .then((payload) => {
          if (controller.signal.aborted || !isActive) {
            return;
          }

          setLanguageSummaryByCountryCode((current) => {
            const next = { ...current };
            payload.forEach((item) => {
              const summary = formatLanguageAndMore(Array.isArray(item.languages) ? item.languages : []);
              if (summary) {
                next[item.countryCode] = summary;
              }
            });
            return next;
          });
        })
        .catch((error) => {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }
          nextCodes.forEach((code) => requestedLanguageCodesRef.current.delete(code));
          console.warn(`Failed loading discovery language samples for ${selectedYear}.`, error);
        })
        .finally(() => {
          if (controller.signal.aborted || !isActive) {
            languageRequestControllersRef.current = languageRequestControllersRef.current.filter((entry) => entry !== controller);
            return;
          }

          setLanguageLoadingByCountryCode((current) => {
            const next = { ...current };
            nextCodes.forEach((code) => {
              delete next[code];
            });
            return next;
          });
          languageRequestControllersRef.current = languageRequestControllersRef.current.filter((entry) => entry !== controller);
        });
    },
    [isActive, languageSummaryByCountryCode, selectedYear]
  );

  useEffect(() => {
    genreRequestControllersRef.current.forEach((controller) => controller.abort());
    genreRequestControllersRef.current = [];
    requestedGenreCodesRef.current = new Set();
    setGenreSummaryByCountryCode({});
    languageRequestControllersRef.current.forEach((controller) => controller.abort());
    languageRequestControllersRef.current = [];
    requestedLanguageCodesRef.current = new Set();
    setLanguageSummaryByCountryCode({});
    setLanguageLoadingByCountryCode({});
    setGenrePrefetchCount(initialDiscoverySamplePrefetchCount);
  }, [selectedYear]);

  useEffect(() => {
    if (isActive) {
      return;
    }

    genreRequestControllersRef.current.forEach((controller) => controller.abort());
    genreRequestControllersRef.current = [];
    languageRequestControllersRef.current.forEach((controller) => controller.abort());
    languageRequestControllersRef.current = [];
    setLanguageLoadingByCountryCode({});
  }, [isActive]);

  useEffect(() => {
    return () => {
      genreRequestControllersRef.current.forEach((controller) => controller.abort());
      genreRequestControllersRef.current = [];
      languageRequestControllersRef.current.forEach((controller) => controller.abort());
      languageRequestControllersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const starterCodes = filteredCountries.slice(0, genrePrefetchCount).map((country) => country.code);
    ensureCountryGenreSamples(visibleSelectedCountryCode ? [visibleSelectedCountryCode, ...starterCodes] : starterCodes);
    ensureCountryLanguageSamples(visibleSelectedCountryCode ? [visibleSelectedCountryCode, ...starterCodes] : starterCodes);
  }, [ensureCountryGenreSamples, ensureCountryLanguageSamples, filteredCountries, genrePrefetchCount, isActive, visibleSelectedCountryCode]);

  const handleGlobeFocus = (countryId: string) => {
    if (countryId === visibleSelectedCountryId) {
      return;
    }

    startTransition(() => {
      onSelectCountry(countryId);
      setListAutoScrollSignal((current) => current + 1);
    });
  };

  const listColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <DiscoverySidebarPanels
        countries={filteredCountries}
        selectedYear={selectedYear}
        selectedCountryId={visibleSelectedCountryId}
        onSelectCountry={onSelectCountry}
        onOpenCountry={onOpenCountry}
        onHoverCountryChange={!isMobileExperience && Platform.OS === "web" ? setHoveredListCountryId : undefined}
        autoScrollSignal={listAutoScrollSignal}
        genreSummaryByCountryCode={displayGenreSummaryByCountryCode}
        languageSummaryByCountryCode={languageSummaryByCountryCode}
        loadingText="Loading..."
        onEnsureGenreSample={(countryCode) => ensureCountryGenreSamples([countryCode])}
        onEnsureLanguageSample={(countryCode) => ensureCountryLanguageSamples([countryCode])}
        onNearListEnd={() => setGenrePrefetchCount((current) => Math.min(filteredCountries.length, current + 12))}
      />
    </View>
  );

  const globeColumn = (
    <View style={[styles.rightColumn, isStacked ? styles.columnStacked : null]}>
      <View style={styles.globePanelWrap}>
        <GlobePanel
          countries={filteredCountries}
          allCountries={filteredCountries}
          isLoading={isLoading}
          hoveredCountryId={!isMobileExperience && Platform.OS === "web" ? hoveredListCountryId : null}
          selectedYear={selectedYear}
          availableYears={timelineYears}
          onSelectCountry={handleGlobeFocus}
          onOpenCountry={onOpenCountry}
          onChangeYear={onChangeYear}
          title="Discovery Map"
          onRightAction={() => setAllFiltersOpen(true)}
          showHeader={false}
          onEnsureGenreSample={(countryCode) => ensureCountryGenreSamples([countryCode])}
          onEnsureLanguageSample={(countryCode) => ensureCountryLanguageSamples([countryCode])}
          isActive={isActive}
        />
      </View>
      {isStacked ? null : (
        <YearSlider
          year={selectedYear}
          onChangeYear={onChangeYear}
          years={timelineYears}
          displayLabel={isAllYearsSelected ? "All Available Years" : undefined}
        />
      )}
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
      <YearDataDisclaimer year={selectedYear} style={styles.discoveryYearDisclaimer} />
      <View style={[styles.layout, isStacked ? styles.layoutStacked : null]}>
        {isStacked ? globeColumn : listColumn}
        {isStacked ? listColumn : globeColumn}
      </View>
    </ScrollView>
  );

  return (
    <ScreenScaffold contentStyle={styles.scaffoldContent} disableScroll>
      <View
        style={styles.discoveryContentFrame}
        pointerEvents={allFiltersOpen ? "none" : "auto"}
      >
        {discoveryContent}
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
            <LinearGradient
              colors={popupBottomDepthGradient}
              locations={[0, 0.72, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.modalDepthFill}
            />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Filters</Text>
              <View style={styles.modalHeaderActions}>
                <Pressable
                  onPress={resetAllFilters}
                  onHoverIn={() => setIsClearHovered(true)}
                  onHoverOut={() => setIsClearHovered(false)}
                  onPressIn={() => setIsClearPressed(true)}
                  onPressOut={() => setIsClearPressed(false)}
                  style={styles.closeButtonShell}
                >
                  {isClearHovered || isClearPressed ? (
                    <LinearGradient
                      colors={isClearPressed ? activeGradient : ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"]}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.closeButtonGradient}
                    />
                  ) : null}
                  <View style={[styles.closeButton, isClearHovered || isClearPressed ? styles.closeButtonActive : null]}>
                    <Text style={[styles.closeButtonText, isClearHovered || isClearPressed ? styles.closeButtonTextActive : null]}>
                      Clear Filters
                    </Text>
                  </View>
                </Pressable>

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
                <Text style={styles.filterSectionTitle}>Years</Text>
                <View style={styles.optionGroup}>
                  <Pressable
                    style={styles.filterButtonShell}
                    onPress={() => setSelectedFilterYears([])}
                  >
                    {isAllYearsSelected ? <LinearGradient colors={activeGradient} locations={[0, 0.34, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.filterButtonGradient} /> : null}
                    <View style={[styles.filterButton, isAllYearsSelected ? styles.filterButtonActive : null]}>
                      <View style={styles.filterButtonContent}>
                        <View style={styles.filterButtonLead}>
                          <GemIcon size={16} />
                          <Text style={[styles.filterButtonText, isAllYearsSelected ? styles.filterButtonTextActive : null]}>All Years</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {timelineYears.map((yearOption) => {
                    const isActive = selectedFilterYears.includes(yearOption);
                    return (
                      <Pressable
                        key={`year-${yearOption}`}
                        style={styles.filterButtonShell}
                        onPress={() => {
                          if (isActive) {
                            setSelectedFilterYears([]);
                            return;
                          }

                          setSelectedFilterYears([yearOption]);
                          if (yearOption !== selectedYear) {
                            onChangeYear(yearOption);
                          }
                        }}
                      >
                        {isActive ? <LinearGradient colors={activeGradient} locations={[0, 0.34, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.filterButtonGradient} /> : null}
                        <View style={[styles.filterButton, isActive ? styles.filterButtonActive : null]}>
                          <View style={styles.filterButtonContent}>
                            <View style={styles.filterButtonLead}>
                              <GemIcon size={16} />
                              <Text style={[styles.filterButtonText, isActive ? styles.filterButtonTextActive : null]}>{yearOption}</Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.filterSectionHint}>
                  Changing the selected year may change which countries are in the resulted list.
                </Text>
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

              {/* Genre filters are intentionally commented out for now.
                  The current live genre data is API-fetched per song and is not normalized
                  enough yet to support trustworthy Discovery filtering. Keep this block for
                  a future normalized-genre iteration instead of deleting it. */}
              {/* <Panel style={styles.filterSection}>
                <SecondarySurfaceFill />
                <Text style={styles.filterSectionTitle}>Genre(s)</Text>
                <View style={styles.optionGroup}>
                  <View style={styles.filterButtonShell}>
                    <View style={styles.filterButton}>
                      <View style={styles.filterButtonContent}>
                        <View style={styles.filterButtonLead}>
                          <GemIcon size={16} />
                          <Text style={styles.filterButtonText}>Genre info coming soon.</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </Panel> */}

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
  discoveryContentFrame: {
    flex: 1,
    minHeight: 0,
  },
  discoveryStack: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  discoveryYearDisclaimer: {
    alignSelf: "flex-end",
  },
  layout: {
    flexDirection: "row",
    alignItems: "stretch",
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
    alignSelf: "stretch",
  },
  rightColumn: {
    flex: 1,
    minWidth: 340,
    gap: 16,
    alignSelf: "stretch",
  },
  globePanelWrap: {
    position: "relative",
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
    zIndex: 80,
    elevation: 80,
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
    maxHeight: Platform.OS === "web" ? "82%" : 560,
    height: Platform.OS === "web" ? undefined : 560,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: colors.panel,
    gap: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(169, 176, 209, 0.24)",
    overflow: "hidden",
    zIndex: 81,
    elevation: 81,
  },
  modalDepthFill: {
    ...StyleSheet.absoluteFillObject,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  modalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 28,
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
    color: colors.textLight,
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
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 22,
  },
  filterSectionHint: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
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
    color: colors.textLight,
  },
});
