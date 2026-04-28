import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
 
import { Country } from "../types/content";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
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
 
  return (
    <ScreenScaffold alwaysScrollableOnWeb>
      <DiscoveryBlurb heading="Search" body="Search countries, albums, artists, songs, or genres." />
 
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search countries, albums, artists, songs, or genres"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
 
      <Panel style={styles.panel}>
        <SecondarySurfaceFill />
        <View style={styles.panelContent}>
          <Text style={styles.sectionHeading}>Country Matches</Text>
          <View style={styles.resultGroup}>
            {(query ? results.countries : countries).slice(0, 8).map((country) => (
              <Pressable
                key={country.id}
                onPress={() => onOpenCountry(country.id)}
                style={({ pressed }) => [styles.resultRow, pressed ? styles.resultRowPressed : null]}
              >
                <View style={styles.resultRowInner}>
                  <Text style={styles.resultTitle}>{country.name}</Text>
                  <Text style={styles.resultMeta}>{country.region}</Text>
                </View>
              </Pressable>
            ))}
          </View>
 
          <View style={styles.divider} />
 
          <Text style={styles.sectionHeading}>Song Matches</Text>
          <View style={styles.resultGroup}>
            {results.songs.length === 0 ? (
              <Text style={styles.copy}>
                {query.trim()
                  ? "No songs found for that query."
                  : "Type a query to search hidden songs and related metadata."}
              </Text>
            ) : (
              results.songs.slice(0, 8).map((song) => (
                <Pressable
                  key={song.id}
                  onPress={() => onOpenSong(song.countryId, song.id)}
                  style={({ pressed }) => [styles.resultRow, pressed ? styles.resultRowPressed : null]}
                >
                  <View style={styles.resultRowInner}>
                    <Text style={styles.resultTitle}>{song.title}</Text>
                    <Text style={styles.resultMeta}>
                      {song.artist} · {song.countryName}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </Panel>
    </ScreenScaffold>
  );
}
 
const styles = StyleSheet.create({
  input: {
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    color: colors.textStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: typefaces.body,
    fontSize: 17,
  },
  panel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  panelContent: {
    padding: 18,
    gap: 12,
  },
  sectionHeading: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  resultGroup: {
    gap: 6,
  },
  resultRow: {
    borderRadius: 14,
    overflow: "hidden",
  },
  resultRowPressed: {
    opacity: 0.7,
  },
  resultRowInner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    gap: 2,
  },
  resultTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 17,
    lineHeight: 20,
  },
  resultMeta: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  divider: {
    height: 2,
    borderRadius: 999,
    backgroundColor: colors.border,
    opacity: 0.24,
    marginVertical: 4,
  },
  copy: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
  },
});