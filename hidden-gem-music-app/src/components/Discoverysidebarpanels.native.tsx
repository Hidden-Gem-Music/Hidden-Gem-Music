import { LinearGradient } from "expo-linear-gradient";
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
 
import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { GemIcon } from "./GemIcon";
import { Panel } from "./Panel";
import { SecondarySurfaceFill } from "./SecondarySurfaceFill";
import { presetFilters } from "./FilterBar";
 
// Mobile-only override of DiscoverySidebarPanels.
// Key differences from the web version:
//   1. No fixed minHeight/maxHeight — panels grow naturally so the parent ScrollView can scroll
//   2. Filter buttons stack label above meta (column layout) instead of a crushed side-by-side row
//   3. CountryCard rows stack vertically on narrow screens
 
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
 
// Lightweight mobile CountryCard — stacks info vertically, no minWidth constraints
function MobileCountryCard({
  country,
  selected,
  onPress,
  onTitlePress,
}: {
  country: Country;
  selected?: boolean;
  onPress: () => void;
  onTitlePress?: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Panel style={[styles.countryCard, selected ? styles.countryCardSelected : null, pressed ? styles.countryCardPressed : null]}>
          <LinearGradient
            colors={
              selected
                ? ["rgba(117,82,107,0.22)", "rgba(117,82,107,0.04)"]
                : ["rgba(169,176,209,0.10)", "rgba(44,46,75,0.02)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGlow}
          />
          {/* Title row */}
          <Pressable onPress={onTitlePress ?? onPress}>
            <Text style={styles.countryName}>{country.name}</Text>
          </Pressable>
          <Text style={styles.countryRegion}>{country.region}</Text>
 
          {/* Detail rows — stacked, not side-by-side */}
          <Text style={styles.countryDetail}>Hidden Songs: {country.hiddenSongs}</Text>
          <Text style={styles.countryDetail} numberOfLines={2}>
            Genres: {country.genres.join(", ")}
          </Text>
          <Text style={styles.countryDetail} numberOfLines={2}>
            Top album: {country.album} by {country.albumArtist}
          </Text>
        </Panel>
      )}
    </Pressable>
  );
}
 
export function DiscoverySidebarPanels({
  countries,
  selectedCountryId,
  onSelectCountry,
  onOpenCountry,
  autoScrollSignal,
}: Props) {
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>("filters");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const positionsRef = useRef<Record<string, number>>({});
  const listScrollRef = useRef<ScrollView>(null);
 
  const handleSectionPress = (panel: ExpandedPanel) => {
    setExpandedPanel((current) => (current === panel ? (panel === "filters" ? "list" : "filters") : panel));
  };
 
  // Auto-scroll to selected country when signalled
  useEffect(() => {
    if (expandedPanel !== "list" || !selectedCountryId || autoScrollSignal == null) return;
    const y = positionsRef.current[selectedCountryId];
    if (typeof y === "number") {
      listScrollRef.current?.scrollTo({ y: Math.max(y - 18, 0), animated: true });
    }
  }, [autoScrollSignal, expandedPanel]);
 
  const renderFilterButton = (label: string) => {
    const isActive = activeFilter === label;
 
    return (
      <Pressable
        key={label}
        onPress={() => setActiveFilter((current) => (current === label ? null : label))}
        style={styles.filterButtonShell}
      >
        {isActive ? (
          <LinearGradient
            colors={activeGradient}
            locations={[0, 0.34, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.filterButtonGradient}
          />
        ) : null}
        <View style={[styles.filterButton, isActive ? styles.filterButtonActive : null]}>
          {/* Mobile fix: label and meta stacked vertically so label never gets crushed */}
          <View style={styles.filterButtonLead}>
            <GemIcon size={14} />
            <Text style={[styles.filterButtonText, isActive ? styles.filterButtonTextActive : null]} numberOfLines={2}>
              {label}
            </Text>
          </View>
          <Text style={[styles.filterButtonMeta, isActive ? styles.filterButtonTextActive : null]}>
            short info on what it means
          </Text>
        </View>
      </Pressable>
    );
  };
 
  return (
    // No fixed height — grows naturally so the parent page ScrollView can scroll through everything
    <View style={styles.frame}>
 
      {/* ── Pre-Selected Filters panel ── */}
      <Panel style={styles.section}>
        <SecondarySurfaceFill />
        <Pressable style={styles.sectionHeader} onPress={() => handleSectionPress("filters")}>
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>Pre-Selected Filters</Text>
            <Text style={styles.sectionHelper}>Tap a filter to apply it</Text>
          </View>
          <Text style={styles.sectionToggle}>{expandedPanel === "filters" ? "−" : "+"}</Text>
        </Pressable>
 
        {expandedPanel === "filters" ? (
          // No ScrollView wrapper here — content renders inline so the parent page scroll handles it
          <View style={styles.filterContent}>
            {presetFilters.map(renderFilterButton)}
          </View>
        ) : null}
      </Panel>
 
      {/* ── Country List panel ── */}
      <Panel style={styles.section}>
        <SecondarySurfaceFill />
        <Pressable style={styles.sectionHeader} onPress={() => handleSectionPress("list")}>
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>List View</Text>
            <Text style={styles.sectionHelper}>{countries.length} countries</Text>
          </View>
          <Text style={styles.sectionToggle}>{expandedPanel === "list" ? "−" : "+"}</Text>
        </Pressable>
 
        {expandedPanel === "list" ? (
          // Same approach — render inline, let page scroll handle it
          <View style={styles.listContent}>
            {countries.map((country) => (
              <View
                key={country.id}
                onLayout={(event: LayoutChangeEvent) => {
                  positionsRef.current[country.id] = event.nativeEvent.layout.y;
                }}
              >
                <MobileCountryCard
                  country={country}
                  selected={country.id === selectedCountryId}
                  onTitlePress={() => onOpenCountry(country.id)}
                  onPress={() => {
                    onSelectCountry(country.id);
                    onOpenCountry(country.id);
                  }}
                />
              </View>
            ))}
          </View>
        ) : null}
      </Panel>
 
    </View>
  );
}
 
const styles = StyleSheet.create({
  // No minHeight/maxHeight — lets the parent page ScrollView do all the scrolling
  frame: {
    gap: 16,
  },
  section: {
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  sectionHeader: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  sectionHelper: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
  },
  sectionToggle: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 28,
  },
 
  // Filter buttons
  filterContent: {
    paddingHorizontal: 14,
    paddingBottom: 18,
    gap: 10,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: "transparent",
  },
  // Mobile fix: label + icon on one line, meta below — no side-by-side squeeze
  filterButtonLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterButtonText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  filterButtonMeta: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 15,
    opacity: 0.7,
    paddingLeft: 22, // indent to align under text (past gem icon)
  },
  filterButtonTextActive: {
    color: colors.text,
  },
 
  // Country list
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 18,
    gap: 12,
  },
 
  // Mobile CountryCard — stacked, no minWidth side-by-side columns
  countryCard: {
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: "rgba(169, 176, 209, 0.18)",
    gap: 6,
    overflow: "hidden",
  },
  countryCardSelected: {
    borderColor: colors.accent,
  },
  countryCardPressed: {
    opacity: 0.82,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    margin: -18,
    borderRadius: 20,
  },
  countryName: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 18,
    lineHeight: 22,
    textDecorationLine: "underline",
  },
  countryRegion: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  countryDetail: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
});