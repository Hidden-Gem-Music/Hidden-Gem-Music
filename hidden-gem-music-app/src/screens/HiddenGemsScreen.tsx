import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Country, Song } from "../types/content";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { YearSelector } from "../components/YearSelector";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  country: Country;
  songs: Song[];
  selectedSongId: string;
  selectedSong: Song;
  onSelectSong: (songId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

export function HiddenGemsScreen({
  country,
  songs,
  selectedSongId,
  selectedSong,
  onSelectSong,
  selectedYear,
  onChangeYear,
}: Props) {
  const selectedSongIndex = songs.findIndex((song) => song.id === selectedSongId);

  return (
    <ScreenScaffold>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {country.name}&apos;s Hidden Songs: {country.hiddenSongs}
        </Text>
        <View style={styles.previewRow}>
          <Text style={styles.helper}>Select a song to play a preview.</Text>
          <View style={styles.controls}>
            <Pressable
              onPress={() =>
                onSelectSong(
                  songs[(selectedSongIndex - 1 + songs.length) % songs.length]?.id ?? selectedSongId
                )
              }
            >
              <Text style={styles.control}>⏮</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(selectedSong.spotifySearchUrl)}>
              <Text style={styles.control}>▶</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onSelectSong(
                  songs[(selectedSongIndex + 1) % songs.length]?.id ?? selectedSongId
                )
              }
            >
              <Text style={styles.control}>⏭</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <YearSelector label="Show Hidden Gems For Year" year={selectedYear} onSelectYear={onChangeYear} />

      <View style={styles.layout}>
        <Panel style={styles.listPanel}>
          {songs.map((song, index) => (
            <Pressable key={song.id} onPress={() => onSelectSong(song.id)}>
              <Panel style={[styles.songItem, selectedSongId === song.id ? styles.songItemSelected : undefined]}>
                <Text style={styles.songTitle}>
                  {index + 1}. {song.title} by {song.artist}
                </Text>
                <Text style={styles.songMeta}>Album Name: {song.album}</Text>
              </Panel>
            </Pressable>
          ))}
        </Panel>

        <Panel style={styles.detailPanel}>
          <View style={styles.coverWrap}>
            <View style={styles.coverArt}>
              <Text style={styles.coverBrand}>MONSTEREO</Text>
              <Text style={styles.coverAlbum}>{selectedSong.album}</Text>
            </View>
          </View>

          <Text style={styles.detailTitle}>
            {selectedSong.title} by {selectedSong.artist}
          </Text>
          <Text style={styles.detailLine}>Year: {selectedSong.year}</Text>
          <Text style={styles.detailLine}>Genre(s): {selectedSong.genres.join(", ")}</Text>
          <Text style={styles.detailLine}>Language(s): {selectedSong.languages.join(", ")}</Text>
          <Text style={styles.detailLine}>Album Name: {selectedSong.album}</Text>
          <Text style={styles.detailLine}>Duration: {selectedSong.duration}</Text>
          <Text style={styles.detailLine}>{selectedSong.description}</Text>
          <ActionButton
            label="Search This Song on Spotify"
            onPress={() => Linking.openURL(selectedSong.spotifySearchUrl)}
          />
        </Panel>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 46,
    fontWeight: "700",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },
  helper: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
  },
  controls: {
    flexDirection: "row",
    gap: 18,
  },
  control: {
    width: 72,
    height: 72,
    borderRadius: 36,
    textAlign: "center",
    lineHeight: 64,
    backgroundColor: colors.accent,
    borderWidth: 4,
    borderColor: colors.border,
    color: colors.panel,
    fontSize: 34,
  },
  layout: {
    flexDirection: "row",
    gap: 24,
    flexWrap: "wrap",
  },
  listPanel: {
    flex: 1,
    minWidth: 340,
    gap: 16,
  },
  detailPanel: {
    flex: 1,
    minWidth: 340,
    gap: 16,
    justifyContent: "flex-start",
  },
  songItem: {
    backgroundColor: colors.panel,
    gap: 14,
  },
  songItemSelected: {
    borderColor: colors.accent,
  },
  songTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    textDecorationLine: "underline",
  },
  songMeta: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    fontWeight: "700",
  },
  coverWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  coverArt: {
    width: "100%",
    maxWidth: 480,
    aspectRatio: 1,
    borderWidth: 6,
    borderColor: "#10141f",
    backgroundColor: "#d5b38f",
    justifyContent: "space-between",
    padding: 22,
  },
  coverBrand: {
    color: "#2d2017",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  coverAlbum: {
    color: "#4e2316",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  detailTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 28,
    fontWeight: "700",
  },
  detailLine: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 28,
  },
});
