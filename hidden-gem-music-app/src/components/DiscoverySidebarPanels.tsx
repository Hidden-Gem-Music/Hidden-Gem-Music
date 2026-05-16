import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";
import { useEffect, useRef, useState } from "react";

import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { CountryCard } from "./CountryCard";
import { presetFilters } from "./FilterBar";
import { GemIcon } from "./GemIcon";
import { Panel } from "./Panel";
import { SecondarySurfaceFill } from "./SecondarySurfaceFill";

type Props = {
  countries: Country[];
  selectedCountryId?: string;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry: (countryId: string) => void;
  onHoverCountryChange?: (countryId: string | null) => void;
  autoScrollSignal?: number;
  selectedYear?: number;
  genreSummaryByCountryCode?: Record<string, string | undefined>;
  genreLoadingByCountryCode?: Record<string, boolean | undefined>;
  loadingText?: string;
  onEnsureGenreSample?: (countryCode: string) => void;
  onNearListEnd?: () => void;
};

type ExpandedPanel = "filters" | "list";

const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;

export function DiscoverySidebarPanels({
  countries,
  selectedCountryId,
  onSelectCountry,
  onOpenCountry,
  onHoverCountryChange,
  autoScrollSignal,
  selectedYear,
  genreSummaryByCountryCode,
  genreLoadingByCountryCode,
  loadingText = "Loading...",
  onEnsureGenreSample,
  onNearListEnd,
}: Props) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isNarrowHeader = width < 520;
  const countriesKey = countries.map((country) => country.id).join("|");
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>("list");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const positionsRef = useRef<Record<string, number>>({});
  const filterScrollRef = useRef<ScrollView>(null);
  const filterTrackRef = useRef<View>(null);
  const [filterViewportHeight, setFilterViewportHeight] = useState(0);
  const [filterContentHeight, setFilterContentHeight] = useState(0);
  const [filterScrollY, setFilterScrollY] = useState(0);
  const [isDraggingFilterScrollbar, setIsDraggingFilterScrollbar] = useState(false);
  const listScrollRef = useRef<ScrollView>(null);
  const listTrackRef = useRef<View>(null);
  const [listViewportHeight, setListViewportHeight] = useState(0);
  const [listContentHeight, setListContentHeight] = useState(0);
  const [listScrollY, setListScrollY] = useState(0);
  const [isDraggingListScrollbar, setIsDraggingListScrollbar] = useState(false);
  const nearListEndTriggeredRef = useRef(false);

  const showFilterScrollbar = isWeb && expandedPanel === "filters" && filterViewportHeight > 0;
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
    isWeb && expandedPanel === "list" && listViewportHeight > 0 && listContentHeight > listViewportHeight;
  const listThumbHeight = listScrollbarVisible ? Math.max((listViewportHeight / listContentHeight) * listViewportHeight, 52) : 0;
  const listThumbTop =
    listScrollbarVisible && listContentHeight > listViewportHeight
      ? (listScrollY / (listContentHeight - listViewportHeight)) * (listViewportHeight - listThumbHeight)
      : 0;
  const listTrackHeight = Math.max(listViewportHeight - 24, 1);

  const handleSectionPress = (panel: ExpandedPanel) => {
    setExpandedPanel((current) => {
      if (current === panel) {
        return panel === "filters" ? "list" : "filters";
      }
      return panel;
    });
  };

  const handleFilterScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setFilterScrollY(event.nativeEvent.contentOffset.y);
  };

  const handleListScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextScrollY = event.nativeEvent.contentOffset.y;
    setListScrollY(nextScrollY);

    if (!onNearListEnd || listViewportHeight <= 0 || listContentHeight <= 0) {
      return;
    }

    const remaining = listContentHeight - (nextScrollY + listViewportHeight);
    if (remaining < 220 && !nearListEndTriggeredRef.current) {
      nearListEndTriggeredRef.current = true;
      onNearListEnd();
      return;
    }

    if (remaining > 360) {
      nearListEndTriggeredRef.current = false;
    }
  };

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
    if (!isWeb || !isDraggingFilterScrollbar || typeof document === "undefined") {
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
  }, [isDraggingFilterScrollbar, filterHasOverflow, filterThumbHeight, filterTrackHeight, filterContentHeight, filterViewportHeight, isWeb]);

  useEffect(() => {
    if (!isWeb || !isDraggingListScrollbar || typeof document === "undefined") {
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
  }, [isDraggingListScrollbar, listScrollbarVisible, listThumbHeight, listTrackHeight, listContentHeight, listViewportHeight, isWeb]);

  useEffect(() => {
    if (expandedPanel !== "list" || !selectedCountryId || autoScrollSignal == null) {
      return;
    }

    const scrollToSelectedCountry = () => {
      const y = positionsRef.current[selectedCountryId];
      if (typeof y === "number") {
        listScrollRef.current?.scrollTo({ y: Math.max(y - 18, 0), animated: false });
      }
    };

    scrollToSelectedCountry();
    const retryTimer = setTimeout(scrollToSelectedCountry, 40);
    return () => clearTimeout(retryTimer);
  }, [autoScrollSignal, expandedPanel, listContentHeight, selectedCountryId]);

  useEffect(() => {
    positionsRef.current = {};
    nearListEndTriggeredRef.current = false;
    setListScrollY((current) => (current === 0 ? current : 0));
    if (isWeb) {
      listScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [countriesKey, isWeb, selectedYear]);

  const renderFilterButton = (label: string) => {
    const isActive = activeFilter === label;
    const isHovered = hoveredFilter === label;
    const showGradient = isActive || isHovered;

    return (
      <Pressable
        key={label}
        onPress={() => setActiveFilter((current) => (current === label ? null : label))}
        onPressIn={() => setHoveredFilter(label)}
        onPressOut={() => setHoveredFilter((current) => (current === label ? null : current))}
        onHoverIn={() => setHoveredFilter(label)}
        onHoverOut={() => setHoveredFilter((current) => (current === label ? null : current))}
        style={styles.filterButtonShell}
      >
        {showGradient ? (
          <LinearGradient
            colors={isActive ? activeGradient : hoverGradient}
            locations={[0, 0.34, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.filterButtonGradient}
          />
        ) : null}
        <View style={[styles.filterButton, showGradient ? styles.filterButtonActive : null]}>
          <View style={styles.filterButtonContent}>
            <View style={styles.filterButtonLead}>
              <GemIcon size={16} />
              <Text style={[styles.filterButtonText, showGradient ? styles.filterButtonTextActive : null]}>{label}</Text>
            </View>
            <Text style={[styles.filterButtonMeta, showGradient ? styles.filterButtonTextActive : null]}>
              short info on what it means
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.frame, !isWeb ? styles.frameNative : null]}>
      <Panel style={[styles.section, expandedPanel === "filters" ? styles.sectionExpanded : styles.sectionCollapsed]}>
        <SecondarySurfaceFill />
        <Pressable style={styles.sectionHeader} onPress={() => handleSectionPress("filters")}>
          <View style={[styles.sectionHeaderCopy, isNarrowHeader ? styles.sectionHeaderCopyStacked : null]}>
            <Text style={[styles.sectionTitle, isNarrowHeader ? styles.sectionTitleStacked : null]}>
              {isNarrowHeader ? "Pre-Selected\nFilters" : "Pre-Selected Filters"}
            </Text>
            <Text style={[styles.sectionHelper, isNarrowHeader ? styles.sectionHelperStacked : null]}>
              Select optional pre-selected filters here and use the All Filters button on the map for more filters.
            </Text>
          </View>
          <Text style={styles.sectionToggle}>{expandedPanel === "filters" ? "−" : "+"}</Text>
        </Pressable>
        {expandedPanel === "filters" ? (
          <View style={[styles.panelArea, !isWeb ? styles.scrollAreaNative : null]}>
            <ScrollView
              ref={filterScrollRef}
              nativeID="discovery-sidebar-filters"
              style={[styles.panelScroll, !isWeb ? styles.panelScrollNative : null]}
              contentContainerStyle={styles.filterContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled
              nestedScrollEnabled
              onLayout={(event) => setFilterViewportHeight(event.nativeEvent.layout.height)}
              onContentSizeChange={(_, height) => setFilterContentHeight(height)}
              onScroll={handleFilterScroll}
              scrollEventThrottle={16}
            >
              {presetFilters.map(renderFilterButton)}
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
                  style={[styles.scrollbarThumb, { height: filterThumbHeight, transform: [{ translateY: filterThumbTop }] }]}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </Panel>

      <Panel style={[styles.section, expandedPanel === "list" ? styles.sectionExpanded : styles.sectionCollapsed]}>
        <SecondarySurfaceFill />
        <Pressable style={styles.sectionHeader} onPress={() => handleSectionPress("list")}>
          <View style={[styles.sectionHeaderCopy, isNarrowHeader ? styles.sectionHeaderCopyStacked : null]}>
            <Text style={styles.sectionTitle}>List View</Text>
            <Text style={[styles.sectionHelper, isNarrowHeader ? styles.sectionHelperStacked : null]}>
              Click a country to view its detail page and hear previews of hidden gem songs.
            </Text>
          </View>
          <Text style={styles.sectionToggle}>{expandedPanel === "list" ? "−" : "+"}</Text>
        </Pressable>
        {expandedPanel === "list" ? (
          <View style={[styles.listArea, !isWeb ? styles.scrollAreaNative : null]}>
            <ScrollView
              ref={listScrollRef}
              nativeID="discovery-sidebar-list"
              style={[styles.panelScroll, !isWeb ? styles.panelScrollNative : null]}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled
              nestedScrollEnabled
              onLayout={(event) => setListViewportHeight(event.nativeEvent.layout.height)}
              onContentSizeChange={(_, height) => setListContentHeight(height)}
              onScroll={handleListScroll}
              scrollEventThrottle={16}
            >
              {countries.length === 0 ? (
                <View style={styles.listLoadingState}>
                  <ActivityIndicator size="large" color={colors.textLight} />
                  <Text style={styles.listLoadingText}>Loading countries...</Text>
                </View>
              ) : countries.map((country) => (
                <View
                  key={country.id}
                  onLayout={(event: LayoutChangeEvent) => {
                    positionsRef.current[country.id] = event.nativeEvent.layout.y;
                  }}
                >
                  <CountryCard
                    country={country}
                    selectedYear={selectedYear}
                    selected={country.id === selectedCountryId}
                    onHover={() => {
                      onEnsureGenreSample?.(country.code);
                      onSelectCountry(country.id);
                      onHoverCountryChange?.(country.id);
                    }}
                    onHoverOut={() => onHoverCountryChange?.(null)}
                    onTitlePress={() => {
                      onEnsureGenreSample?.(country.code);
                      onOpenCountry(country.id);
                    }}
                    genreLine={genreSummaryByCountryCode?.[country.code] ?? (genreLoadingByCountryCode?.[country.code] ? loadingText : "Loading...")}
                    languageLine="Coming Soon"
                    onPress={() => {
                      onEnsureGenreSample?.(country.code);
                      onSelectCountry(country.id);
                      onOpenCountry(country.id);
                    }}
                    onPressIn={() => {
                      onEnsureGenreSample?.(country.code);
                      onSelectCountry(country.id);
                    }}
                  />
                </View>
              ))}
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
                <View style={[styles.scrollbarThumb, { height: listThumbHeight, transform: [{ translateY: listThumbTop }] }]} />
              </View>
            ) : null}
          </View>
        ) : null}
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    minHeight: 824,
    maxHeight: 824,
    gap: 16,
    alignSelf: "stretch",
  },
  frameNative: {
    minHeight: 0,
    height: 760,
    maxHeight: undefined,
  },
  section: {
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  sectionExpanded: {
    flex: 1,
  },
  sectionCollapsed: {
    minHeight: 104,
  },
  sectionHeader: {
    minHeight: 104,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionHeaderCopy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionHeaderCopyStacked: {
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 10,
  },
  sectionTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  sectionTitleStacked: {
    maxWidth: 148,
  },
  sectionHelper: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 16,
    textAlign: "right",
    maxWidth: 220,
  },
  sectionHelperStacked: {
    textAlign: "left",
    maxWidth: "100%",
    width: "100%",
  },
  sectionToggle: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 28,
    marginTop: 6,
  },
  filterContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingRight: 28,
    gap: 14,
  },
  filterButtonShell: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
  },
  filterButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  filterButton: {
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
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
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  filterButtonText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 17,
    lineHeight: 22,
    textAlign: "left",
    flexShrink: 1,
  },
  filterButtonMeta: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
    textAlign: "right",
    flexShrink: 0,
  },
  filterButtonTextActive: {
    color: colors.textLight,
  },
  panelArea: {
    flex: 1,
    position: "relative",
  },
  listArea: {
    flex: 1,
    position: "relative",
  },
  scrollAreaNative: {
    flex: 1,
    minHeight: 0,
    maxHeight: undefined,
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
  panelScrollNative: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingRight: 28,
    gap: 14,
  },
  listLoadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 26,
    gap: 10,
  },
  listLoadingText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },
  scrollbarTrack: {
    position: "absolute",
    top: 12,
    right: 8,
    bottom: 12,
    width: 14,
    borderRadius: 999,
    backgroundColor: colors.scrollbarTrack,
    cursor: "pointer" as any,
  },
  scrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.scrollbarThumb,
  },
});
