import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { ActionButton } from "../components/ActionButton";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
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

const continentOptions = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
] as const;

function toggleFilterSelection(current: string[], option: string) {
  if (option === "All") return ["All"];
  const without = current.filter((v) => v !== "All");
  if (without.includes(option)) {
    const next = without.filter((v) => v !== option);
    return next.length > 0 ? next : ["All"];
  }
  return [...without, option];
}

// ── Year Dropdown ────────────────────────────────────────────────────────────
function YearDropdown({
  year,
  onSelectYear,
}: {
  year: number;
  onSelectYear: (y: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [triggerLayout, setTriggerLayout] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setOpen(true);
    });
  };

  return (
    <View style={dropdownStyles.wrap}>
      <Text style={dropdownStyles.label}>Year</Text>
      {/* Trigger */}
      <Pressable
        ref={triggerRef}
        onPress={handleOpen}
        style={dropdownStyles.trigger}
      >
        <Text style={dropdownStyles.triggerText}>{year}</Text>
        <Text style={dropdownStyles.caret}>▾</Text>
      </Pressable>

      {/* Full-screen modal dropdown */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={dropdownStyles.backdrop} />
        </TouchableWithoutFeedback>

        {triggerLayout && (
          <View
            style={[
              dropdownStyles.menu,
              {
                top: triggerLayout.y + triggerLayout.height + 6,
                left: triggerLayout.x,
                width: triggerLayout.width,
              },
            ]}
          >
            <ScrollView
              style={dropdownStyles.menuScroll}
              showsVerticalScrollIndicator={false}
            >
              {availableYears.map((y) => (
                <Pressable
                  key={y}
                  onPress={() => {
                    onSelectYear(y);
                    setOpen(false);
                  }}
                  style={[
                    dropdownStyles.menuItem,
                    y === year ? dropdownStyles.menuItemActive : null,
                  ]}
                >
                  <Text
                    style={[
                      dropdownStyles.menuItemText,
                      y === year ? dropdownStyles.menuItemTextActive : null,
                    ]}
                  >
                    {y}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const dropdownStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
  },
  triggerText: {
    flex: 1,
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 18,
    lineHeight: 22,
  },
  caret: {
    color: colors.border,
    fontSize: 14,
    lineHeight: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22,26,38,0.48)",
  },
  menu: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
    maxHeight: 260,
    zIndex: 100,
    shadowColor: colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  menuScroll: {
    flexGrow: 0,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(169,176,209,0.12)",
  },
  menuItemActive: {
    backgroundColor: "rgba(117,82,107,0.22)",
  },
  menuItemText: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 17,
    lineHeight: 20,
  },
  menuItemTextActive: {
    color: colors.accent,
  },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export function ComparisonSelectScreen({
  countries,
  selectedCountryIds,
  onToggleCountry,
  onDone,
  selectedYear,
  onChangeYear,
}: Props) {
  const [validationOpen, setValidationOpen] = useState(false);
  const [regionFilters, setRegionFilters] = useState<string[]>(["All"]);
  const [genreFilters, setGenreFilters] = useState<string[]>(["All"]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const genreOptions = useMemo(
    () => Array.from(new Set(countries.flatMap((c) => c.genres ?? []))).sort(),
    [countries]
  );

  const filteredCountries = useMemo(() => {
    return countries.filter((c) => {
      if (!regionFilters.includes("All") && !regionFilters.includes(c.region))
        return false;
      if (
        !genreFilters.includes("All") &&
        !genreFilters.some((g) => (c.genres ?? []).includes(g))
      )
        return false;
      return true;
    });
  }, [countries, regionFilters, genreFilters]);

  const visible =
    filteredCountries.length > 0 ? filteredCountries : countries;

  const handleDone = () => {
    if (selectedCountryIds.length !== 2) {
      setValidationOpen(true);
      return;
    }
    onDone();
  };

  return (
    <ScreenScaffold contentStyle={styles.scaffold}>
      {/* Explicit ScrollView so native always scrolls regardless of window width */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DiscoveryBlurb
          heading="Comparison Mode"
          body="Select two countries and a year to compare their music charts side by side."
        />

        {/* ── Year + Done ── */}
        <Panel style={styles.controlPanel}>
          <LinearGradient
            colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.72)"]}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.panelFill}
          />
          <View style={styles.controlRow}>
            <YearDropdown year={selectedYear} onSelectYear={onChangeYear} />
            <ActionButton label="Done" size="small" onPress={handleDone} />
          </View>
          <Text style={styles.selectionHint}>
            {selectedCountryIds.length} of 2 countries selected
          </Text>
        </Panel>

        {/* ── Filters (collapsible) ── */}
        <Panel style={styles.filterPanel}>
          <SecondarySurfaceFill />
          <Pressable
            onPress={() => setFiltersExpanded((v) => !v)}
            style={styles.filterHeader}
          >
            <Text style={styles.filterTitle}>Filters</Text>
            <Text style={styles.filterToggle}>{filtersExpanded ? "−" : "+"}</Text>
          </Pressable>

          {filtersExpanded && (
            <View style={styles.filterBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Region:</Text>
                <View style={styles.chipRow}>
                  {(["All", ...continentOptions] as string[]).map((opt) => {
                    const active = regionFilters.includes(opt);
                    return (
                      <Pressable
                        key={opt}
                        onPress={() =>
                          setRegionFilters(
                            toggleFilterSelection(regionFilters, opt)
                          )
                        }
                        style={[styles.chip, active ? styles.chipActive : null]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active ? styles.chipTextActive : null,
                          ]}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Genre:</Text>
                <View style={styles.chipRow}>
                  {(["All", ...genreOptions.slice(0, 8)] as string[]).map(
                    (opt) => {
                      const active = genreFilters.includes(opt);
                      return (
                        <Pressable
                          key={opt}
                          onPress={() =>
                            setGenreFilters(
                              toggleFilterSelection(genreFilters, opt)
                            )
                          }
                          style={[
                            styles.chip,
                            active ? styles.chipActive : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active ? styles.chipTextActive : null,
                            ]}
                          >
                            {opt}
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </View>
              </View>
            </View>
          )}
        </Panel>

        {/* ── Country list — inline, no internal ScrollView ── */}
        <Panel style={styles.listPanel}>
          <SecondarySurfaceFill />
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Select Two Countries</Text>
            <Text style={styles.listSubtitle}>{visible.length} countries</Text>
          </View>
          <View style={styles.listBody}>
            {visible.map((country) => {
              const selected = selectedCountryIds.includes(country.id);
              return (
                <Pressable
                  key={country.id}
                  onPress={() => onToggleCountry(country.id)}
                  style={[
                    styles.countryRow,
                    selected ? styles.countryRowSelected : null,
                  ]}
                >
                  {selected && (
                    <LinearGradient
                      colors={[
                        colors.navGradient,
                        colors.backgroundRaised,
                        colors.backgroundRaised,
                      ]}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <View style={styles.countryRowInner}>
                    <GemIcon size={14} />
                    <View style={styles.countryTextBlock}>
                      <Text
                        style={[
                          styles.countryName,
                          selected ? styles.countryTextSelected : null,
                        ]}
                        numberOfLines={1}
                      >
                        {country.name}
                      </Text>
                      <Text
                        style={[
                          styles.countryRegion,
                          selected ? styles.countryTextSelected : null,
                        ]}
                        numberOfLines={1}
                      >
                        {country.region}
                      </Text>
                    </View>
                    {selected && (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Panel>
      </ScrollView>

      {/* ── Validation modal ── */}
      {validationOpen && (
        <View style={styles.overlay}>
          <View style={styles.overlayBg} />
          <Panel style={styles.modal}>
            <Text style={styles.modalTitle}>Select 2 Countries</Text>
            <Text style={styles.modalBody}>
              Please select exactly two countries before continuing.
            </Text>
            <ActionButton
              label="Close"
              size="compact"
              onPress={() => setValidationOpen(false)}
            />
          </Panel>
        </View>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scaffold: {
    padding: 0,
    gap: 0,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 48,
  },

  // Control bar
  controlPanel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  panelFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  selectionHint: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
    textAlign: "center",
    paddingBottom: 16,
  },

  // Filters
  filterPanel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  filterTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  filterToggle: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 28,
  },
  filterBody: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 14,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 16,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "rgba(117,82,107,0.22)",
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
  },
  chipTextActive: {
    color: colors.text,
  },

  // Country list
  listPanel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  listTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  listSubtitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
  },
  listBody: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 8,
  },
  countryRow: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    minHeight: 58,
    justifyContent: "center",
  },
  countryRowSelected: {
    borderColor: colors.accent,
  },
  countryRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  countryTextBlock: {
    flex: 1,
    gap: 2,
  },
  countryName: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 16,
    lineHeight: 20,
  },
  countryRegion: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    opacity: 0.8,
  },
  countryTextSelected: {
    color: colors.text,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "800",
  },

  // Validation modal
  overlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22,26,38,0.72)",
  },
  modal: {
    width: "100%",
    alignItems: "center",
    gap: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  modalTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 28,
    textAlign: "center",
  },
  modalBody: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});