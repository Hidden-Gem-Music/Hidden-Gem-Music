import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

import { ActionButton } from "../components/ActionButton";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { GlobePanel } from "../components/globe/GlobePanel";
import { availableYears } from "../data/mockData";
import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  countries: Country[];
  selectedCountryIds: string[];
  onToggleCountry: (countryId: string) => void;
  onDone: () => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

type ExpandedPanel = "list" | "filters";
type ComparisonFilters = {
  popularity: string[];
  region: string[];
  language: string[];
  genre: string[];
};

const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const comparisonPanelGradient = [colors.backgroundSoft, "#74819B", "#7A4762"] as const;
const softPanelGradient = [colors.backgroundSoft, "#74819B", "#5D6983", "#36405B"] as const;
const continentOptions = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"] as const;

function toggleFilterSelection(currentValues: string[], option: string) {
  if (option === "All") {
    return ["All"];
  }

  const valuesWithoutAll = currentValues.filter((value) => value !== "All");

  if (valuesWithoutAll.includes(option)) {
    const nextValues = valuesWithoutAll.filter((value) => value !== option);
    return nextValues.length > 0 ? nextValues : ["All"];
  }

  return [...valuesWithoutAll, option];
}

function YearDropdown({
  selectedYear,
  onSelectYear,
}: {
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const showButtonGradient = isHovered || isPressed || isOpen;

  return (
    <View style={styles.yearDropdownWrap}>
      <Pressable
        onPress={() => setIsOpen((current) => !current)}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={styles.yearDropdownShell}
      >
        {showButtonGradient ? (
          <LinearGradient
            colors={isPressed ? activeGradient : hoverGradient}
            locations={[0, 0.34, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.yearDropdownButtonGradient}
          />
        ) : null}
        <View style={[styles.yearDropdownButton, showButtonGradient ? styles.yearDropdownButtonActive : null]}>
          <Text style={[styles.yearDropdownText, selectedYear == null ? styles.yearDropdownPlaceholder : null]}>
            {selectedYear == null ? "Select year" : `${selectedYear}`}
          </Text>
          <Text style={styles.yearDropdownChevron}>{isOpen ? "-" : "+"}</Text>
        </View>
      </Pressable>
      {isOpen ? (
        <Panel style={styles.yearDropdownMenu}>
          <SecondarySurfaceFill />
          <ScrollView style={styles.yearDropdownScroll} contentContainerStyle={styles.yearDropdownContent}>
            {availableYears
              .slice()
              .reverse()
              .map((year) => {
                const selected = selectedYear === year;
                const hovered = hoveredYear === year;
                const showGradient = selected || hovered;

                return (
                  <Pressable
                    key={year}
                    onHoverIn={() => setHoveredYear(year)}
                    onHoverOut={() => setHoveredYear((current) => (current === year ? null : current))}
                    onPress={() => {
                      onSelectYear(year);
                      setIsOpen(false);
                    }}
                    style={styles.yearDropdownOptionShell}
                  >
                    {showGradient ? (
                      <LinearGradient
                        colors={selected ? activeGradient : hoverGradient}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.yearDropdownOptionGradient}
                      />
                    ) : null}
                    <View style={[styles.yearDropdownOption, showGradient ? styles.yearDropdownOptionActive : null]}>
                      <Text style={[styles.yearDropdownOptionText, showGradient ? styles.yearDropdownOptionTextActive : null]}>
                        {year}
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

function ComparisonBlurb({
  selectedYear,
  onSelectYear,
  onDone,
}: {
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
  onDone: () => void;
}) {
  return (
    <Panel style={styles.blurbPanel}>
      <LinearGradient
        colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.42)", "rgba(66,72,101,0.72)"]}
        locations={[0, 0.42, 0.78, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.blurbFill}
      />
      <View style={styles.blurbContent}>
        <View style={styles.blurbCopy}>
          <Text style={styles.blurbText}>
            <Text style={styles.blurbHeading}>Comparison View</Text>
            {"  "}
            <GemIcon size={16} style={styles.blurbIcon} />
            {"  "}
            <Text style={styles.blurbBody}>
              This is text about how to use the comparison view, and how to use the filters, lorem ipsum yadayada.
            </Text>
          </Text>
        </View>
        <View style={styles.blurbActions}>
          <YearDropdown selectedYear={selectedYear} onSelectYear={onSelectYear} />
          <ActionButton label="Done" size="small" onPress={onDone} />
        </View>
      </View>
    </Panel>
  );
}

function ComparisonSidebarPanels({
  visibleCountries,
  selectedCountryIds,
  onToggleCountry,
  filters,
  onChangeFilter,
  regionOptions,
  languageOptions,
  genreOptions,
}: {
  visibleCountries: Country[];
  selectedCountryIds: string[];
  onToggleCountry: (countryId: string) => void;
  filters: ComparisonFilters;
  onChangeFilter: (key: keyof ComparisonFilters, value: string[]) => void;
  regionOptions: string[];
  languageOptions: string[];
  genreOptions: string[];
}) {
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>("list");
  const [hoveredFilterOption, setHoveredFilterOption] = useState<string | null>(null);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const filterScrollRef = useRef<ScrollView>(null);
  const filterTrackRef = useRef<View>(null);
  const listScrollRef = useRef<ScrollView>(null);
  const listTrackRef = useRef<View>(null);
  const [filterScrollY, setFilterScrollY] = useState(0);
  const [listScrollY, setListScrollY] = useState(0);
  const [filterViewportHeight, setFilterViewportHeight] = useState(0);
  const [listViewportHeight, setListViewportHeight] = useState(0);
  const [filterContentHeight, setFilterContentHeight] = useState(0);
  const [listContentHeight, setListContentHeight] = useState(0);
  const [isDraggingFilterScrollbar, setIsDraggingFilterScrollbar] = useState(false);
  const [isDraggingListScrollbar, setIsDraggingListScrollbar] = useState(false);
  const showFilterScrollbar = Platform.OS === "web" && expandedPanel === "filters" && filterViewportHeight > 0;
  const filterHasOverflow = showFilterScrollbar && filterContentHeight > filterViewportHeight;
  const filterTrackHeight = Math.max(filterViewportHeight - 24, 1);
  const filterThumbHeight = showFilterScrollbar
    ? filterHasOverflow
      ? Math.max((filterViewportHeight / filterContentHeight) * filterViewportHeight, 52)
      : filterTrackHeight
    : 0;
  const filterThumbTop =
    filterHasOverflow
      ? (filterScrollY / (filterContentHeight - filterViewportHeight)) * (filterViewportHeight - filterThumbHeight)
      : 0;
  const listScrollbarVisible =
    Platform.OS === "web" && expandedPanel === "list" && listViewportHeight > 0 && listContentHeight > listViewportHeight;
  const listTrackHeight = Math.max(listViewportHeight - 24, 1);
  const listThumbHeight = listScrollbarVisible
    ? Math.max((listViewportHeight / listContentHeight) * listViewportHeight, 52)
    : 0;
  const listThumbTop =
    listScrollbarVisible && listContentHeight > listViewportHeight
      ? (listScrollY / (listContentHeight - listViewportHeight)) * (listViewportHeight - listThumbHeight)
      : 0;

  const scrollFilterToTrackLocation = (locationY: number) => {
    if (!filterHasOverflow || filterContentHeight <= filterViewportHeight) {
      return;
    }

    const nextThumbTop = Math.min(Math.max(locationY - filterThumbHeight / 2, 0), filterTrackHeight - filterThumbHeight);
    const nextRatio = nextThumbTop / (filterTrackHeight - filterThumbHeight);
    const nextScrollY = nextRatio * (filterContentHeight - filterViewportHeight);
    filterScrollRef.current?.scrollTo({ y: nextScrollY, animated: false });
    setFilterScrollY(nextScrollY);
  };

  const scrollListToTrackLocation = (locationY: number) => {
    if (!listScrollbarVisible || listContentHeight <= listViewportHeight) {
      return;
    }

    const nextThumbTop = Math.min(Math.max(locationY - listThumbHeight / 2, 0), listTrackHeight - listThumbHeight);
    const nextRatio = nextThumbTop / (listTrackHeight - listThumbHeight);
    const nextScrollY = nextRatio * (listContentHeight - listViewportHeight);
    listScrollRef.current?.scrollTo({ y: nextScrollY, animated: false });
    setListScrollY(nextScrollY);
  };

  const scrollFilterToClientY = (clientY: number) => {
    const rect = (filterTrackRef.current as any)?.getBoundingClientRect?.();
    if (!rect) {
      return;
    }

    scrollFilterToTrackLocation(clientY - rect.top);
  };

  const scrollListToClientY = (clientY: number) => {
    const rect = (listTrackRef.current as any)?.getBoundingClientRect?.();
    if (!rect) {
      return;
    }

    scrollListToTrackLocation(clientY - rect.top);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || !isDraggingFilterScrollbar || typeof document === "undefined") {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;

    const handleMove = (event: MouseEvent) => {
      event.preventDefault();
      scrollFilterToClientY(event.clientY);
    };

    const handleUp = () => {
      setIsDraggingFilterScrollbar(false);
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [filterContentHeight, filterHasOverflow, filterThumbHeight, filterTrackHeight, filterViewportHeight, isDraggingFilterScrollbar]);

  useEffect(() => {
    if (Platform.OS !== "web" || !isDraggingListScrollbar || typeof document === "undefined") {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;

    const handleMove = (event: MouseEvent) => {
      event.preventDefault();
      scrollListToClientY(event.clientY);
    };

    const handleUp = () => {
      setIsDraggingListScrollbar(false);
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingListScrollbar, listContentHeight, listScrollbarVisible, listThumbHeight, listTrackHeight, listViewportHeight]);

  const renderInlineFilterRow = (
    label: string,
    filterKey: keyof ComparisonFilters,
    options: string[]
  ) => {
    const currentValues = filters[filterKey];

    return (
      <View key={filterKey} style={styles.inlineFilterRow}>
        <Text style={styles.inlineFilterLabel}>{`${label}:`}</Text>
        <View style={styles.inlineFilterOptions}>
          {options.map((option) => {
            const optionKey = `${filterKey}-${option}`;
            const isActive = currentValues.includes(option);
            const isHovered = hoveredFilterOption === optionKey;
            const showGradient = isActive || isHovered;
            const chipTextStyle = isActive
              ? styles.inlineFilterChipTextActive
              : isHovered
                ? styles.inlineFilterChipTextHovered
                : null;

            return (
              <Pressable
                key={optionKey}
                onPress={() => onChangeFilter(filterKey, toggleFilterSelection(currentValues, option))}
                onHoverIn={() => setHoveredFilterOption(optionKey)}
                onHoverOut={() => setHoveredFilterOption((current) => (current === optionKey ? null : current))}
                style={styles.inlineFilterChipShell}
              >
                {showGradient ? (
                  <LinearGradient
                    colors={isActive ? activeGradient : hoverGradient}
                    locations={[0, 0.34, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.inlineFilterChipGradient}
                  />
                ) : null}
                <View style={[styles.inlineFilterChip, showGradient ? styles.inlineFilterChipActive : null]}>
                  <Text style={[styles.inlineFilterChipText, chipTextStyle]}>{option}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderCountryRow = (country: Country) => {
    const selected = selectedCountryIds.includes(country.id);
    const hovered = hoveredCountryId === country.id;
    const showGradient = selected || hovered;

    return (
      <Pressable
        key={country.id}
        onPress={() => onToggleCountry(country.id)}
        onHoverIn={() => setHoveredCountryId(country.id)}
        onHoverOut={() => setHoveredCountryId((current) => (current === country.id ? null : current))}
        style={styles.countryRowShell}
      >
        {showGradient ? (
          <LinearGradient
            colors={selected ? activeGradient : hoverGradient}
            locations={[0, 0.34, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.countryRowGradient}
          />
        ) : null}
        <View style={[styles.countryRow, showGradient ? styles.countryRowActive : null]}>
          <View style={styles.countryRowLead}>
            <GemIcon size={16} />
            <Text style={[styles.countryRowText, showGradient ? styles.countryRowTextActive : null]}>{country.name}</Text>
          </View>
          <Text style={[styles.countryRowMeta, showGradient ? styles.countryRowTextActive : null]}>{country.region}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.sidebarFrame}>
      <Panel
        style={[
          styles.sidebarSection,
          expandedPanel === "filters" ? styles.sidebarSectionExpanded : styles.sidebarSectionCollapsed,
        ]}
      >
        <LinearGradient
          colors={softPanelGradient}
          locations={[0, 0.42, 0.74, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sectionFill}
        />
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setExpandedPanel((current) => (current === "filters" ? "list" : "filters"))}
        >
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>Add Your Filters</Text>
            <Text style={styles.sectionHelper}>Add optional filters before you select two countries.</Text>
          </View>
          <Text style={styles.sectionToggle}>{expandedPanel === "filters" ? "-" : "+"}</Text>
        </Pressable>
        {expandedPanel === "filters" ? (
          <View style={styles.panelArea}>
            <ScrollView
              ref={filterScrollRef}
              style={styles.panelScroll}
              contentContainerStyle={styles.filterContent}
              showsVerticalScrollIndicator={false}
              onLayout={(event) => setFilterViewportHeight(event.nativeEvent.layout.height)}
              onContentSizeChange={(_, height) => setFilterContentHeight(height)}
              onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => setFilterScrollY(event.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
            >
              {renderInlineFilterRow("Popularity", "popularity", ["Biggest Hits", "Fast Rising Songs", "All Songs"])}
              {renderInlineFilterRow("Region", "region", ["All", ...regionOptions])}
              {renderInlineFilterRow("Language", "language", ["All", ...languageOptions])}
              {renderInlineFilterRow("Genre", "genre", ["All", ...genreOptions])}
            </ScrollView>
            {showFilterScrollbar ? (
              <View
                ref={filterTrackRef}
                style={styles.scrollbarTrack}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(event) => scrollFilterToTrackLocation(event.nativeEvent.locationY)}
                onResponderMove={(event) => scrollFilterToTrackLocation(event.nativeEvent.locationY)}
                {...(Platform.OS === "web"
                  ? ({
                      onMouseDown: (event: any) => {
                        event.preventDefault();
                        setIsDraggingFilterScrollbar(true);
                        scrollFilterToClientY(event.clientY);
                      },
                    } as any)
                  : {})}
              >
                <View
                  style={[
                    styles.scrollbarThumb,
                    {
                      height: filterThumbHeight,
                      transform: [{ translateY: filterThumbTop }],
                    },
                  ]}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </Panel>

      <Panel
        style={[
          styles.sidebarSection,
          expandedPanel === "list" ? styles.sidebarSectionExpanded : styles.sidebarSectionCollapsed,
        ]}
      >
        <LinearGradient
          colors={comparisonPanelGradient}
          locations={[0, 0.38, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sectionFill}
        />
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setExpandedPanel((current) => (current === "list" ? "filters" : "list"))}
        >
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>Select Two Countries</Text>
            <Text style={styles.sectionHelper}>{`${selectedCountryIds.length} out of 2 countries selected.`}</Text>
          </View>
          <Text style={styles.sectionToggle}>{expandedPanel === "list" ? "-" : "+"}</Text>
        </Pressable>
        {expandedPanel === "list" ? (
          <View style={styles.panelArea}>
            <ScrollView
              ref={listScrollRef}
              style={styles.panelScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onLayout={(event) => setListViewportHeight(event.nativeEvent.layout.height)}
              onContentSizeChange={(_, height) => setListContentHeight(height)}
              onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => setListScrollY(event.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
            >
              {visibleCountries.map(renderCountryRow)}
            </ScrollView>
            {listScrollbarVisible ? (
              <View
                ref={listTrackRef}
                style={styles.scrollbarTrack}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(event) => scrollListToTrackLocation(event.nativeEvent.locationY)}
                onResponderMove={(event) => scrollListToTrackLocation(event.nativeEvent.locationY)}
                {...(Platform.OS === "web"
                  ? ({
                      onMouseDown: (event: any) => {
                        event.preventDefault();
                        setIsDraggingListScrollbar(true);
                        scrollListToClientY(event.clientY);
                      },
                    } as any)
                  : {})}
              >
                <View
                  style={[
                    styles.scrollbarThumb,
                    {
                      height: listThumbHeight,
                      transform: [{ translateY: listThumbTop }],
                    },
                  ]}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </Panel>
    </View>
  );
}

function SelectionRequiredModal({ onClose }: { onClose: () => void }) {
  return (
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
        <Text style={styles.modalBrand}>Comparison Mode</Text>
        <Text style={styles.modalSummary}>Please select a year and two countries before clicking done.</Text>
        <View style={styles.modalButtonStack}>
          <ActionButton label="Close" size="compact" onPress={onClose} />
        </View>
      </Panel>
    </View>
  );
}

export function ComparisonSelectScreen({
  countries,
  selectedCountryIds,
  onToggleCountry,
  onDone,
  selectedYear,
  onChangeYear,
}: Props) {
  const { width } = useWindowDimensions();
  const isStacked = width < 980;
  const [comparisonYear, setComparisonYear] = useState<number | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [filters, setFilters] = useState<ComparisonFilters>({
    popularity: ["All Songs"],
    region: ["All"],
    language: ["All"],
    genre: ["All"],
  });
  const regionOptions = useMemo(() => [...continentOptions], []);
  const languageOptions = useMemo(
    () => Array.from(new Set(countries.flatMap((country) => country.languages ?? []))).sort((a, b) => a.localeCompare(b)),
    [countries]
  );
  const genreOptions = useMemo(
    () => Array.from(new Set(countries.flatMap((country) => country.genres ?? []))).sort((a, b) => a.localeCompare(b)),
    [countries]
  );
  const filteredCountries = useMemo(
    () =>
      countries.filter((country) => {
        if (!filters.region.includes("All") && !filters.region.includes(country.region)) {
          return false;
        }
        if (
          !filters.language.includes("All") &&
          !filters.language.some((language) => (country.languages ?? []).includes(language))
        ) {
          return false;
        }
        if (!filters.genre.includes("All") && !filters.genre.some((genre) => (country.genres ?? []).includes(genre))) {
          return false;
        }
        return true;
      }),
    [countries, filters.genre, filters.language, filters.region]
  );
  const visibleCountries = filteredCountries.length > 0 ? filteredCountries : countries;

  const handleDone = () => {
    if (comparisonYear == null || selectedCountryIds.length !== 2) {
      setValidationOpen(true);
      return;
    }

    onDone();
  };

  const globeColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <GlobePanel
        countries={visibleCountries}
        activeCountryId={selectedCountryIds.find((countryId) => visibleCountries.some((country) => country.id === countryId))}
        onSelectCountry={onToggleCountry}
        title=""
        showHeader={false}
        frameStyle={styles.comparisonGlobeFrame}
        selectOnHover={false}
      />
    </View>
  );

  const sidebarColumn = (
    <View style={[styles.rightColumn, isStacked ? styles.columnStacked : null]}>
      <ComparisonSidebarPanels
        visibleCountries={visibleCountries}
        selectedCountryIds={selectedCountryIds}
        onToggleCountry={onToggleCountry}
        filters={filters}
        onChangeFilter={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
        regionOptions={regionOptions}
        languageOptions={languageOptions}
        genreOptions={genreOptions}
      />
    </View>
  );

  const comparisonContent = (
    <View style={styles.stack}>
      <ComparisonBlurb
        selectedYear={comparisonYear}
        onSelectYear={(year) => {
          setComparisonYear(year);
          onChangeYear(year);
        }}
        onDone={handleDone}
      />
      <View
        style={[
          styles.layout,
          isStacked ? styles.layoutStacked : null,
        ]}
      >
        {globeColumn}
        {sidebarColumn}
      </View>
    </View>
  );

  return (
    <ScreenScaffold alwaysScrollableOnWeb>
      {comparisonContent}
      {validationOpen ? <SelectionRequiredModal onClose={() => setValidationOpen(false)} /> : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
    marginTop: -8,
  },
  blurbPanel: {
    minHeight: 80,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    overflow: "visible",
    zIndex: 6,
  },
  blurbFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  blurbContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  },
  blurbCopy: {
    flex: 1,
    minWidth: 340,
  },
  blurbText: {
    textAlign: "left",
  },
  blurbIcon: {
    transform: [{ translateY: 1 }],
  },
  blurbHeading: {
    color: colors.text,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  blurbBody: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 28,
  },
  blurbActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    zIndex: 7,
  },
  yearDropdownWrap: {
    position: "relative",
    zIndex: 9,
  },
  yearDropdownShell: {
    borderRadius: 17,
    overflow: "hidden",
  },
  yearDropdownButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  yearDropdownButton: {
    minWidth: 156,
    minHeight: 38,
    height: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  yearDropdownButtonActive: {
    backgroundColor: "transparent",
  },
  yearDropdownText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    lineHeight: 18,
  },
  yearDropdownPlaceholder: {
    color: colors.border,
  },
  yearDropdownChevron: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 28,
    lineHeight: 28,
  },
  yearDropdownMenu: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 156,
    maxHeight: 260,
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
    zIndex: 20,
    elevation: 20,
  },
  yearDropdownScroll: {
    maxHeight: 260,
  },
  yearDropdownContent: {
    padding: 8,
    gap: 8,
  },
  yearDropdownOptionShell: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  yearDropdownOptionGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  yearDropdownOption: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
  },
  yearDropdownOptionActive: {
    backgroundColor: "transparent",
  },
  yearDropdownOptionText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
  },
  yearDropdownOptionTextActive: {
    color: colors.text,
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
    zIndex: 1,
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
  comparisonGlobeFrame: {
    minHeight: 642,
    borderColor: colors.border,
    borderWidth: 3,
  },
  sidebarFrame: {
    minHeight: 642,
    maxHeight: 642,
    gap: 16,
  },
  sidebarSection: {
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  sectionFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebarSectionExpanded: {
    flex: 1,
  },
  sidebarSectionCollapsed: {
    minHeight: 104,
  },
  sectionHeader: {
    minHeight: 88,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionHeaderCopy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionTitle: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  sectionHelper: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 16,
    textAlign: "right",
    maxWidth: 260,
    flexShrink: 1,
  },
  sectionToggle: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 28,
    marginTop: 6,
  },
  panelArea: {
    flex: 1,
    position: "relative",
  },
  panelScroll: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
          scrollbarWidth: "none",
        } as ViewStyle)
      : null),
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 24,
    paddingRight: 28,
    gap: 14,
  },
  filterContent: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 24,
    paddingRight: 28,
    gap: 14,
  },
  countryRowShell: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
  },
  countryRowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  countryRow: {
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  countryRowActive: {
    backgroundColor: "transparent",
  },
  countryRowLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  countryRowText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 17,
    lineHeight: 22,
    textAlign: "left",
    flexShrink: 1,
  },
  countryRowMeta: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
    textAlign: "right",
    flexShrink: 0,
  },
  countryRowTextActive: {
    color: colors.text,
  },
  inlineFilterRow: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(15,16,21,0.12)",
    padding: 14,
    gap: 10,
  },
  inlineFilterLabel: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  inlineFilterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inlineFilterChipShell: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
  },
  inlineFilterChipGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  inlineFilterChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
  },
  inlineFilterChipActive: {
    backgroundColor: "transparent",
  },
  inlineFilterChipText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
  },
  inlineFilterChipTextActive: {
    color: colors.text,
  },
  inlineFilterChipTextHovered: {
    color: colors.border,
  },
  scrollbarTrack: {
    position: "absolute",
    top: 12,
    right: 8,
    bottom: 12,
    width: 14,
    borderRadius: 999,
    backgroundColor: colors.scrollbarTrack,
  },
  scrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.scrollbarThumb,
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
  modalBrand: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 40,
    lineHeight: 46,
    textAlign: "center",
  },
  modalSummary: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    maxWidth: 620,
  },
  modalButtonStack: {
    gap: 14,
    alignItems: "center",
  },
});
