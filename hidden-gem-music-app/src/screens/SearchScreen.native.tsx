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
import { GemIcon } from "../components/GemIcon";
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

function ResultRow({
  title,
  meta,
  onPress,
}: {
  title: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.resultRow, pressed ? styles.resultRowPressed : null]}
    >
      <View style={styles.resultRowInner}>
        <GemIcon size={12} />
        <View style={styles.resultRowText}>
          <Text style={styles.resultTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.resultMeta} numberOfLines={1}>{meta}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function SearchScreen({
  countries,
  selectedYear,
  searchLibrary,
  onOpenCountry,
  onOpenSong,
}: Props) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => searchLibrary(query, selectedYear),
    [query, searchLibrary, selectedYear]
  );

  const hasQuery = query.trim().length > 0;
  const countryResults = (hasQuery ? results.countries : countries).slice(0, 8);
  const songResults = results.songs.slice(0, 8);

  return (
    <ScreenScaffold contentStyle={styles.scaffold}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Always a ScrollView so the whole screen scrolls on native */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            !hasQuery ? styles.scrollContentIdle : null,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info blurb — only shown in idle state */}
          {!hasQuery && (
            <DiscoveryBlurb
              heading="Search"
              body="Search countries, albums, artists, songs, or genres to explore hidden gems from around the world."
            />
          )}

          <MobileSearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries, albums, artists..."
            onClear={() => setQuery("")}
          />

          {/* Results — only shown when there is a query */}
          {hasQuery && (
            <>
              {/* Country results */}
              <Panel style={styles.section}>
                <SecondarySurfaceFill />
                <View style={styles.sectionContent}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Country Matches</Text>
                    <Text style={styles.sectionCount}>{countryResults.length}</Text>
                  </View>
                  <View style={styles.resultGroup}>
                    {countryResults.length === 0 ? (
                      <Text style={styles.emptyText}>No countries matched your search.</Text>
                    ) : (
                      countryResults.map((country) => (
                        <ResultRow
                          key={country.id}
                          title={country.name}
                          meta={country.region}
                          onPress={() => onOpenCountry(country.id)}
                        />
                      ))
                    )}
                  </View>
                </View>
              </Panel>

              {/* Song results */}
              <Panel style={styles.section}>
                <SecondarySurfaceFill />
                <View style={styles.sectionContent}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Song Matches</Text>
                    <Text style={styles.sectionCount}>{songResults.length}</Text>
                  </View>
                  <View style={styles.resultGroup}>
                    {songResults.length === 0 ? (
                      <Text style={styles.emptyText}>No songs found for that query.</Text>
                    ) : (
                      songResults.map((song) => (
                        <ResultRow
                          key={song.id}
                          title={song.title}
                          meta={`${song.artist} · ${song.countryName}`}
                          onPress={() => onOpenSong(song.countryId, song.id)}
                        />
                      ))
                    )}
                  </View>
                </View>
              </Panel>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scaffold: { padding: 0, gap: 0 },
  keyboardAvoid: { flex: 1 },

  // Single scroll container used for both idle and results states
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 48,
  },
  // Idle: normal top-down layout with blurb + search bar
  scrollContentIdle: {
    paddingBottom: 80,
  },
  section: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  sectionContent: { padding: 16, gap: 12 },
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
  resultGroup: { gap: 8 },
  resultRow: { borderRadius: 14, overflow: "hidden" },
  resultRowPressed: { opacity: 0.7 },
  resultRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultRowText: { flex: 1, gap: 2 },
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
  emptyText: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 4,
  },
});