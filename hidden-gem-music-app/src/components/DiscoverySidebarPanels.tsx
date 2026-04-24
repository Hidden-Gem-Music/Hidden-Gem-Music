import { LinearGradient } from "expo-linear-gradient";
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";
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
  autoScrollSignal?: number;
};

type ExpandedPanel = "filters" | "list";

const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;

export function DiscoverySidebarPanels({ countries, selectedCountryId, onSelectCountry, onOpenCountry, autoScrollSignal }: Props) {
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>("filters");
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
    setListScrollY(event.nativeEvent.contentOffset.y);
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
  }, [isDraggingFilterScrollbar, filterHasOverflow, filterThumbHeight, filterTrackHeight, filterContentHeight, filterViewportHeight]);

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
  }, [isDraggingListScrollbar, listScrollbarVisible, listThumbHeight, listTrackHeight, listContentHeight, listViewportHeight]);

  useEffect(() => {
    if (expandedPanel !== "list" || !selectedCountryId || autoScrollSignal == null) {
      return;
    }

    const y = positionsRef.current[selectedCountryId];
    if (typeof y === "number") {
      listScrollRef.current?.scrollTo({ y: Math.max(y - 18, 0), animated: true });
    }
  }, [autoScrollSignal, expandedPanel]);

  const renderFilterButton = (label: string) => {
    const isActive = activeFilter === label;
    const isHovered = hoveredFilter === label;
    const showGradient = isActive || isHovered;

    return (
      <Pressable
        key={label}
        onPress={() => setActiveFilter((current) => (current === label ? null : label))}
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
    <View style={styles.frame}>
      <Panel style={[styles.section, expandedPanel === "filters" ? styles.sectionExpanded : styles.sectionCollapsed]}>
        <SecondarySurfaceFill />
        <Pressable style={styles.sectionHeader} onPress={() => handleSectionPress("filters")}>
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>Pre-Selected Filters</Text>
            <Text style={styles.sectionHelper}>Lorem ipsum dolor{"\n"}sit amet elit magna nunc vel</Text>
          </View>
          <Text style={styles.sectionToggle}>{expandedPanel === "filters" ? "−" : "+"}</Text>
        </Pressable>
        {expandedPanel === "filters" ? (
          <View style={styles.panelArea}>
            <ScrollView
              ref={filterScrollRef}
              nativeID="discovery-sidebar-filters"
              style={styles.panelScroll}
              contentContainerStyle={styles.filterContent}
              showsVerticalScrollIndicator={false}
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
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>List View</Text>
            <Text style={styles.sectionHelper}>Lorem ipsum dolor{"\n"}sit amet elit magna nunc vel</Text>
          </View>
          <Text style={styles.sectionToggle}>{expandedPanel === "list" ? "−" : "+"}</Text>
        </Pressable>
        {expandedPanel === "list" ? (
          <View style={styles.listArea}>
            <ScrollView
              ref={listScrollRef}
              nativeID="discovery-sidebar-list"
              style={styles.panelScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onLayout={(event) => setListViewportHeight(event.nativeEvent.layout.height)}
              onContentSizeChange={(_, height) => setListContentHeight(height)}
              onScroll={handleListScroll}
              scrollEventThrottle={16}
            >
              {countries.map((country) => (
                <View
                  key={country.id}
                  onLayout={(event: LayoutChangeEvent) => {
                    positionsRef.current[country.id] = event.nativeEvent.layout.y;
                  }}
                >
                  <CountryCard
                    country={country}
                    selected={country.id === selectedCountryId}
                    onHover={() => onSelectCountry(country.id)}
                    onTitlePress={() => onOpenCountry(country.id)}
                    onPress={() => {
                      onSelectCountry(country.id);
                      onOpenCountry(country.id);
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
    minHeight: 642,
    maxHeight: 642,
    gap: 16,
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
  sectionTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  sectionHelper: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 16,
    textAlign: "right",
    maxWidth: 176,
  },
  sectionToggle: {
    color: colors.textStrong,
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
    color: colors.text,
  },
  panelArea: {
    flex: 1,
    position: "relative",
  },
  listArea: {
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
    paddingBottom: 24,
    paddingRight: 28,
    gap: 14,
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
