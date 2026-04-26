import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
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

import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { GlobePanel } from "../components/globe/GlobePanel";
import { YearSlider } from "../components/YearSlider";
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

const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;

function ComparisonBlurb({ onDone }: { onDone: () => void }) {
  const [isDoneHovered, setIsDoneHovered] = useState(false);
  const [isDonePressed, setIsDonePressed] = useState(false);
  const showDoneGradient = isDoneHovered || isDonePressed;

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
        <View style={styles.blurbTopRow}>
          <Pressable
            onPress={onDone}
            onHoverIn={() => setIsDoneHovered(true)}
            onHoverOut={() => setIsDoneHovered(false)}
            onPressIn={() => setIsDonePressed(true)}
            onPressOut={() => setIsDonePressed(false)}
            style={styles.doneButtonShell}
          >
            {showDoneGradient ? (
              <LinearGradient
                colors={isDonePressed ? activeGradient : hoverGradient}
                locations={[0, 0.34, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.doneButtonGradient}
              />
            ) : null}
            <View style={[styles.doneButton, showDoneGradient ? styles.doneButtonActive : null]}>
              <Text style={[styles.doneButtonText, showDoneGradient ? styles.doneButtonTextActive : null]}>Done</Text>
            </View>
          </Pressable>
        </View>
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
    </Panel>
  );
}

function CountryPickingPanel({
  countries,
  selectedCountryIds,
  onToggleCountry,
}: {
  countries: Country[];
  selectedCountryIds: string[];
  onToggleCountry: (countryId: string) => void;
}) {
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const trackRef = useRef<View>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const scrollbarVisible = Platform.OS === "web" && viewportHeight > 0;
  const hasOverflow = scrollbarVisible && contentHeight > viewportHeight;
  const trackHeight = Math.max(viewportHeight - 12, 1);
  const thumbHeight = scrollbarVisible
    ? hasOverflow
      ? Math.max((viewportHeight / contentHeight) * viewportHeight, 60)
      : trackHeight
    : 0;
  const thumbTop = hasOverflow ? (scrollY / (contentHeight - viewportHeight)) * (viewportHeight - thumbHeight) : 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

  const scrollToTrackLocation = (locationY: number) => {
    if (!hasOverflow || contentHeight <= viewportHeight) {
      return;
    }

    const nextThumbTop = Math.min(Math.max(locationY - thumbHeight / 2, 0), trackHeight - thumbHeight);
    const nextRatio = nextThumbTop / (trackHeight - thumbHeight);
    const nextScrollY = nextRatio * (contentHeight - viewportHeight);
    scrollRef.current?.scrollTo({ y: nextScrollY, animated: false });
    setScrollY(nextScrollY);
  };

  const scrollToClientY = (clientY: number) => {
    const rect = (trackRef.current as any)?.getBoundingClientRect?.();
    if (!rect) {
      return;
    }

    scrollToTrackLocation(clientY - rect.top);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || !isDraggingScrollbar || typeof document === "undefined") {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;

    const handleMove = (event: MouseEvent) => {
      event.preventDefault();
      scrollToClientY(event.clientY);
    };

    const handleUp = () => {
      setIsDraggingScrollbar(false);
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [contentHeight, hasOverflow, isDraggingScrollbar, thumbHeight, trackHeight, viewportHeight]);

  return (
    <Panel style={styles.countryPickingPanel}>
      <SecondarySurfaceFill />
      <View style={styles.countryPickingHeader}>
        <View style={styles.countryPickingHeaderCopy}>
          <Text style={styles.countryPickingTitle}>Select two countries</Text>
          <Text style={styles.countryPickingHelper}>{`${selectedCountryIds.length} out of 2 countries selected.`}</Text>
        </View>
      </View>
      <View style={styles.countryPickingListFrame}>
        <ScrollView
          ref={scrollRef}
          style={styles.countryPickingScroll}
          contentContainerStyle={styles.countryPickingContent}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {countries.map((country) => {
            const selected = selectedCountryIds.includes(country.id);
            const hovered = hoveredCountryId === country.id;
            const showGradient = selected || hovered;

            return (
              <Pressable
                key={country.id}
                onPress={() => onToggleCountry(country.id)}
                onHoverIn={() => setHoveredCountryId(country.id)}
                onHoverOut={() => setHoveredCountryId((current) => (current === country.id ? null : current))}
                style={styles.countryPickingRowShell}
              >
                {showGradient ? (
                  <LinearGradient
                    colors={selected ? activeGradient : hoverGradient}
                    locations={[0, 0.34, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.countryPickingRowGradient}
                  />
                ) : null}
                <View style={[styles.countryPickingRow, showGradient ? styles.countryPickingRowActive : null]}>
                  <View style={styles.countryPickingRowLead}>
                    <GemIcon size={16} />
                    <Text style={[styles.countryPickingRowName, showGradient ? styles.countryPickingRowTextActive : null]}>
                      {country.name}
                    </Text>
                  </View>
                  <Text style={[styles.countryPickingRowMeta, showGradient ? styles.countryPickingRowTextActive : null]}>
                    {country.region}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        {scrollbarVisible ? (
          <View
            ref={trackRef}
            style={styles.countryPickingScrollbarTrack}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => scrollToTrackLocation(event.nativeEvent.locationY)}
            onResponderMove={(event) => scrollToTrackLocation(event.nativeEvent.locationY)}
            {...(Platform.OS === "web"
              ? ({
                  onMouseDown: (event: any) => {
                    event.preventDefault();
                    setIsDraggingScrollbar(true);
                    scrollToClientY(event.clientY);
                  },
                } as any)
              : {})}
          >
            <View style={[styles.countryPickingScrollbarThumb, { height: thumbHeight, transform: [{ translateY: thumbTop }] }]} />
          </View>
        ) : null}
      </View>
    </Panel>
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
  const { width, height } = useWindowDimensions();
  const isStacked = width < 980;
  const allowShortViewportHorizontalScroll = Platform.OS === "web" && !isStacked && height < 860;
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);

  const globeColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <GlobePanel
        countries={countries}
        activeCountryId={selectedCountryIds[0] ?? countries[0]?.id ?? ""}
        onSelectCountry={onToggleCountry}
        title=""
        rightActionLabel="Filters"
        onRightAction={() => setAllFiltersOpen(true)}
        showHeader={false}
      />
      <YearSlider year={selectedYear} onChangeYear={onChangeYear} />
    </View>
  );

  const countryPickingColumn = (
    <View style={[styles.rightColumn, isStacked ? styles.columnStacked : null]}>
      <CountryPickingPanel countries={countries} selectedCountryIds={selectedCountryIds} onToggleCountry={onToggleCountry} />
    </View>
  );

  const comparisonContent = (
    <View style={[styles.stack, allowShortViewportHorizontalScroll ? styles.stackScrollable : null]}>
      <ComparisonBlurb onDone={onDone} />
      <View
        style={[
          styles.layout,
          isStacked ? styles.layoutStacked : null,
          allowShortViewportHorizontalScroll ? styles.layoutScrollable : null,
        ]}
      >
        {globeColumn}
        {countryPickingColumn}
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
          {comparisonContent}
        </ScrollView>
      ) : (
        comparisonContent
      )}
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
              <Text style={styles.modalTitle}>Filters</Text>
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
  stack: {
    gap: 16,
    marginTop: -8,
  },
  stackScrollable: {
    minWidth: 1040,
  },
  blurbPanel: {
    minHeight: 96,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  blurbFill: {
    ...StyleSheet.absoluteFillObject,
  },
  blurbContent: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
  blurbTopRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
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
  doneButtonShell: {
    borderRadius: 14,
    overflow: "hidden",
  },
  doneButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  doneButton: {
    minHeight: 48,
    minWidth: 118,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
    alignItems: "center",
  },
  doneButtonActive: {
    backgroundColor: "transparent",
  },
  doneButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 20,
    lineHeight: 22,
    textAlign: "center",
  },
  doneButtonTextActive: {
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
  countryPickingPanel: {
    minHeight: 642,
    maxHeight: 642,
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  countryPickingHeader: {
    minHeight: 104,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: "center",
  },
  countryPickingHeaderCopy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  countryPickingTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  countryPickingHelper: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
    textAlign: "right",
    maxWidth: 260,
    flexShrink: 1,
  },
  countryPickingListFrame: {
    flex: 1,
    position: "relative",
  },
  countryPickingScroll: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
          scrollbarWidth: "none",
        } as ViewStyle)
      : null),
  },
  countryPickingContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingRight: 34,
    gap: 14,
    minWidth: "100%",
  },
  countryPickingScrollbarTrack: {
    position: "absolute",
    top: 6,
    right: 8,
    bottom: 6,
    width: 14,
    borderRadius: 999,
    backgroundColor: colors.scrollbarTrack,
    cursor: "pointer" as any,
  },
  countryPickingScrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.scrollbarThumb,
  },
  countryPickingRowShell: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
  },
  countryPickingRowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  countryPickingRow: {
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
  countryPickingRowActive: {
    backgroundColor: "transparent",
  },
  countryPickingRowLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  countryPickingRowName: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 17,
    lineHeight: 22,
    textAlign: "left",
    flexShrink: 1,
  },
  countryPickingRowMeta: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
    textAlign: "right",
    flexShrink: 0,
  },
  countryPickingRowTextActive: {
    color: colors.text,
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
    fontSize: 30,
    lineHeight: 34,
  },
  modalClose: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 18,
  },
});
