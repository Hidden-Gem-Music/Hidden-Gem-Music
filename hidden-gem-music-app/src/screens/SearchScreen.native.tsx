import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Country } from "../types/content";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { MobileSearchBar } from "../components/MobileSearchBar";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  countries: Country[];
  selectedYear: number;
  searchLibrary: (
    query: string,
    year: number
  ) => {
    countries: Country[];
    songs: Array<{
      id: string;
      title: string;
      artist: string;
      countryName: string;
      countryId: string;
    }>;
  };
  onOpenCountry: (countryId: string) => void;
  onOpenSong: (countryId: string, songId: string) => void;
};

export function SearchScreen({
  countries,
  onOpenCountry,
}: Props) {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();

  // All countries shown when no query, filtered by name as user types
  const results = useMemo(() => {
    if (!normalized) return countries;
    return countries.filter((c) =>
      c.name.toLowerCase().includes(normalized)
    );
  }, [countries, normalized]);

  // Only show "not found" message when user has typed something
  // and no countries match at all
  const hasQuery = normalized.length > 0;
  const noResults = hasQuery && results.length === 0;

  // Try to find an exact or close match to show the "not in our data" message
  // e.g. user typed "Narnia" — no match at all
  const notFoundName = noResults
    ? query.trim().replace(/\b\w/g, (c) => c.toUpperCase()) // title case the query
    : null;

  return (
    <ScreenScaffold contentStyle={styles.scaffold}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            !hasQuery ? styles.scrollContentIdle : null,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info blurb — only shown when idle */}
          {!hasQuery && (
            <DiscoveryBlurb
              heading="Search"
              body="Type a country name to find it in our library. Results narrow down as you type."
            />
          )}

          <MobileSearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a country..."
            onClear={() => setQuery("")}
          />

          {/* Results panel — shown once user starts typing */}
          {hasQuery && (
            <Panel style={styles.section}>
              <SecondarySurfaceFill />
              <View style={styles.sectionContent}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Countries</Text>
                  <Text style={styles.sectionCount}>
                    {noResults ? "0" : results.length}
                  </Text>
                </View>

                {noResults ? (
                  // "Not in our data" message — matches web SearchOverlay behaviour
                  <Text style={styles.notFoundText}>
                    {notFoundName} is not included in our data at this time.
                  </Text>
                ) : (
                  <View style={styles.resultGroup}>
                    {results.map((country) => (
                      <Pressable
                        key={country.id}
                        onPress={() => onOpenCountry(country.id)}
                        style={({ pressed }) => [
                          styles.resultRow,
                          pressed ? styles.resultRowPressed : null,
                        ]}
                      >
                        <View style={styles.resultRowInner}>
                          <View style={styles.resultRowText}>
                            <Text style={styles.resultTitle} numberOfLines={1}>
                              {country.name}
                            </Text>
                            <Text style={styles.resultMeta} numberOfLines={1}>
                              {country.region}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </Panel>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scaffold: { padding: 0, gap: 0 },
  keyboardAvoid: { flex: 1 },

  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 48,
  },
  scrollContentIdle: {
    paddingBottom: 80,
  },

  section: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  sectionContent: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  sectionCount: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  resultGroup: {
    gap: 8,
  },
  resultRow: {
    borderRadius: 14,
    overflow: "hidden",
  },
  resultRowPressed: {
    opacity: 0.7,
  },
  resultRowInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultRowText: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 16,
    lineHeight: 20,
  },
  resultMeta: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
  },
  notFoundText: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 4,
  },
});