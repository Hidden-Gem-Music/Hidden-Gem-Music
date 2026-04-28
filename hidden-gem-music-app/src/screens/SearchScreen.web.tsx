import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Country } from "../types/content";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  countries: Country[];
  selectedYear: number;
  searchLibrary: (query: string, year: number) => {
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
  const results = useMemo(() => searchLibrary(query, selectedYear), [query, searchLibrary, selectedYear]);

  return (
    <ScreenScaffold alwaysScrollableOnWeb>
      <Text style={styles.title}>Search</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search countries, albums, artists, songs, or genres"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <Panel style={styles.panel}>
        <Text style={styles.sectionHeading}>Country Matches</Text>
        <View style={styles.resultGroup}>
          {(query ? results.countries : countries).slice(0, 8).map((country) => (
            <Pressable key={country.id} onPress={() => onOpenCountry(country.id)}>
              <Text style={styles.resultText}>
                {country.name} • {country.region} • {country.album}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionHeading}>Song Matches</Text>
        <View style={styles.resultGroup}>
          {results.songs.length === 0 ? (
            <Text style={styles.copy}>Type a query to search hidden songs and related metadata.</Text>
          ) : (
            results.songs.slice(0, 8).map((song) => (
              <Pressable key={song.id} onPress={() => onOpenSong(song.countryId, song.id)}>
                <Text style={styles.resultText}>
                  {song.title} by {song.artist} • {song.countryName}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </Panel>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 56,
    fontWeight: "700",
  },
  input: {
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    color: colors.textStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: typefaces.body,
    fontSize: 18,
  },
  panel: {
    minHeight: 420,
    gap: 16,
  },
  sectionHeading: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 22,
  },
  resultGroup: {
    gap: 10,
  },
  resultText: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 18,
  },
  copy: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 18,
    lineHeight: 28,
  },
});
