import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";

import { Country, Song } from "../types/content";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { availableYears } from "../data/mockData";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  country: Country;
  countries: Country[];
  songs: Song[];
  selectedSongId: string;
  selectedSong: Song;
  onSelectSong: (songId: string) => void;
  onSelectCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

const rowBackdropColors = ["#B86A72", "#8B9BC0", "#8B5E7A", "#627F8A", "#C28C5E", "#7A7EB0"];
const cdCaseSource = require("../assets/images/CD-Case-Transparent-Image.png");
const hiddenGemTitleTerms = ["Afterlight", "Glassroom", "Signal", "Static", "Midnight", "Echo", "Receiver", "Velvet"];
const hiddenGemAlbumTerms = ["Circuit", "Atlas", "Bloom", "Relay", "Theatre", "Horizon", "Current", "Transit"];

function buildGeneratedHiddenGemSongs(country: Country, songs: Song[]): Song[] {
  return Array.from({ length: 25 }, (_, index) => {
    const leadArtist =
      country.featuredArtists[index % country.featuredArtists.length] ??
      country.albumArtist;
    const titleLead = hiddenGemTitleTerms[index % hiddenGemTitleTerms.length];
    const titleTail = hiddenGemTitleTerms[(index + 3) % hiddenGemTitleTerms.length];
    const albumTail = hiddenGemAlbumTerms[index % hiddenGemAlbumTerms.length];
    const baseSong = songs[index % Math.max(songs.length, 1)];
    return {
      id: `${country.id}-generated-hidden-gem-${index + 1}`,
      title: `${country.name} ${titleLead} ${titleTail}`,
      artist: leadArtist,
      album: baseSong?.album ?? `${country.album} ${albumTail}`,
      genres: baseSong?.genres?.length ? baseSong.genres : country.genres.slice(0, 2),
      languages: baseSong?.languages?.length
        ? baseSong.languages
        : country.languages.slice(0, 2),
      year: baseSong?.year ?? 2021,
      duration: baseSong?.duration ?? "3:42",
      description: "A quieter cut with strong late-night energy and a more country-specific pull.",
      spotifySearchUrl: `https://open.spotify.com/search/${encodeURIComponent(
        `${leadArtist} ${country.name} ${titleLead}`
      )}`,
    } satisfies Song;
  });
}

// ── Year Dropdown (same pattern as ComparisonSelectScreen) ───────────────────
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
    x: number;
    y: number;
    width: number;
    height: number;
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
      <Pressable ref={triggerRef} onPress={handleOpen} style={dropdownStyles.trigger}>
        <Text style={dropdownStyles.triggerText}>{year}</Text>
        <Text style={dropdownStyles.caret}>▾</Text>
      </Pressable>

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
            <ScrollView style={dropdownStyles.menuScroll} showsVerticalScrollIndicator={false}>
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
    gap: 8,
  },
  label: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 84,
  },
  triggerText: {
    flex: 1,
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 16,
    lineHeight: 20,
  },
  caret: {
    color: colors.border,
    fontSize: 12,
    lineHeight: 16,
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
    maxHeight: 240,
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
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(169,176,209,0.12)",
  },
  menuItemActive: {
    backgroundColor: "rgba(117,82,107,0.22)",
  },
  menuItemText: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 16,
    lineHeight: 20,
  },
  menuItemTextActive: {
    color: colors.accent,
  },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export function HiddenGemsScreen({
  country,
  countries,
  songs,
  selectedSongId,
  selectedSong,
  onSelectSong,
  onSelectCountry,
  selectedYear,
  onChangeYear,
}: Props) {
  const hiddenGemSongs = useMemo(
    () => [...songs, ...buildGeneratedHiddenGemSongs(country, songs)],
    [country, songs]
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSongId, setActiveSongId] = useState(
    () => selectedSongId || selectedSong?.id || hiddenGemSongs[0]?.id || ""
  );

  const safeSelectedSong =
    hiddenGemSongs.find((s) => s.id === activeSongId) ??
    hiddenGemSongs.find((s) => s.id === selectedSongId) ??
    selectedSong ??
    hiddenGemSongs[0];

  useEffect(() => {
    if (selectedSongId && hiddenGemSongs.some((s) => s.id === selectedSongId)) {
      setActiveSongId(selectedSongId);
    }
  }, [hiddenGemSongs, selectedSongId]);

  const selectedIndex = hiddenGemSongs.findIndex((s) => s.id === safeSelectedSong?.id);

  const stepSong = (dir: -1 | 1) => {
    if (!hiddenGemSongs.length || selectedIndex < 0) return;
    const next =
      hiddenGemSongs[(selectedIndex + dir + hiddenGemSongs.length) % hiddenGemSongs.length];
    if (next) {
      setActiveSongId(next.id);
      setIsPlaying(false); // reset play state on song change — audio engine will hook in here
    }
  };

  if (!safeSelectedSong) {
    return (
      <ScreenScaffold>
        <View style={styles.pageFrame} />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold contentStyle={styles.scaffold}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header blurb ── */}
        <Panel style={styles.blurbPanel}>
          <LinearGradient
            colors={[
              colors.surfaceSecondary,
              "#27293B",
              "rgba(66,72,101,0.42)",
              "rgba(66,72,101,0.72)",
            ]}
            locations={[0, 0.42, 0.78, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.blurbFill}
          />
          {/* Row 1: title + hidden gems stat */}
          <View style={styles.blurbTitleRow}>
            <Text style={styles.blurbHeading} numberOfLines={2}>
              {country.name}'s Hidden Gems
            </Text>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[colors.backgroundSoft, "#74819B", "#7A4762"]}
                locations={[0, 0.38, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.statValue}>{country.hiddenSongs}</Text>
              <Text style={styles.statLabel}>Hidden{"\n"}Gems</Text>
            </View>
          </View>
          {/* Row 2: body + year dropdown */}
          <View style={styles.blurbBottomRow}>
            <Text style={styles.blurbBody}>
              Select a song to view its details. Tap the CD image to preview it on Spotify.
            </Text>
            <YearDropdown year={selectedYear} onSelectYear={onChangeYear} />
          </View>
        </Panel>

        {/* ── Now Playing ── */}
        <Panel style={styles.nowPlayingPanel}>
          <SecondarySurfaceFill />
          <View style={styles.nowPlayingContent}>
            {/* Prev / CD / Next */}
            <View style={styles.controls}>
              <Pressable onPress={() => stepSong(-1)} style={styles.controlBtn}>
                <GemIcon size={28} style={styles.arrowLeft} />
              </Pressable>
              <View style={styles.cdWrap}>
                <View style={styles.cdBackdrop} />
                <Image source={cdCaseSource} style={styles.cdImage} resizeMode="contain" />
              </View>
              <Pressable onPress={() => stepSong(1)} style={styles.controlBtn}>
                <GemIcon size={28} style={styles.arrowRight} />
              </Pressable>
            </View>

            <Text style={styles.songName} numberOfLines={2}>
              {safeSelectedSong.title}
            </Text>
            <Text style={styles.songArtist}>{safeSelectedSong.artist}</Text>
            <View style={styles.songUnderline} />

            {[
              { label: "Album", value: safeSelectedSong.album },
              { label: "Genre(s)", value: safeSelectedSong.genres.join(", ") },
              { label: "Language(s)", value: safeSelectedSong.languages.join(", ") },
              { label: "Year", value: `${safeSelectedSong.year}` },
            ].map((item) => (
              <View key={item.label} style={styles.metaCard}>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaLabelText}>{item.label}: </Text>
                  <Text style={styles.metaValueText}>{item.value}</Text>
                </Text>
              </View>
            ))}

            {/* ── Transport controls: Prev / Play / Next ── */}
            <View style={styles.transport}>
              {/* Previous */}
              <Pressable
                onPress={() => stepSong(-1)}
                style={styles.transportBtn}
                hitSlop={8}
              >
                <Text style={styles.transportIcon}>⏮</Text>
              </Pressable>

              {/* Play / Pause — placeholder until audio engine is wired in */}
              <Pressable
                onPress={() => setIsPlaying((p) => !p)}
                style={styles.transportPlayBtn}
                hitSlop={8}
              >
                <Text style={styles.transportPlayIcon}>
                  {isPlaying ? "■" : "▶"}
                </Text>
              </Pressable>

              {/* Next */}
              <Pressable
                onPress={() => stepSong(1)}
                style={styles.transportBtn}
                hitSlop={8}
              >
                <Text style={styles.transportIcon}>⏭</Text>
              </Pressable>
            </View>
          </View>
        </Panel>

        {/* ── Song list ── */}
        <Panel style={styles.listPanel}>
          <SecondarySurfaceFill />
          <View style={styles.listContent}>
            <Text style={styles.listTitle}>All Hidden Gems</Text>
            {hiddenGemSongs.slice(0, 30).map((song, i) => {
              const isSelected = song.id === safeSelectedSong.id;
              return (
                <Pressable
                  key={song.id}
                  onPress={() => setActiveSongId(song.id)}
                  style={[styles.songRow, isSelected ? styles.songRowSelected : null]}
                >
                  <Text style={[styles.songRank, isSelected ? styles.songTextActive : null]}>
                    {i + 1}.
                  </Text>
                  <View style={styles.songTextBlock}>
                    <Text
                      style={[styles.songRowTitle, isSelected ? styles.songTextActive : null]}
                      numberOfLines={1}
                    >
                      {song.title}
                    </Text>
                    <Text
                      style={[styles.songRowArtist, isSelected ? styles.songTextActive : null]}
                      numberOfLines={1}
                    >
                      {song.artist}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.songCd,
                      { backgroundColor: rowBackdropColors[i % rowBackdropColors.length] },
                    ]}
                  >
                    <Image source={cdCaseSource} style={styles.songCdImg} resizeMode="contain" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Panel>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  pageFrame: { flex: 1 },
  scaffold: { padding: 0, gap: 0 },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },

  // Blurb
  blurbPanel: {
    backgroundColor: "transparent",
    overflow: "hidden",
    padding: 0,
  },
  blurbFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  blurbTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  blurbHeading: {
    flex: 1,
    color: colors.text,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  statCard: {
    width: 68,
    height: 68,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    flexShrink: 0,
  },
  statValue: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 26,
    lineHeight: 28,
    textAlign: "center",
  },
  statLabel: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 9,
    lineHeight: 11,
    textAlign: "center",
  },
  blurbBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexWrap: "wrap",
  },
  blurbBody: {
    flex: 1,
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
    minWidth: 160,
  },

  // Now Playing
  nowPlayingPanel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  nowPlayingContent: {
    padding: 16,
    gap: 10,
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 4,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: { transform: [{ rotate: "90deg" }] },
  arrowRight: { transform: [{ rotate: "-90deg" }] },
  cdWrap: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cdBackdrop: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 12,
    backgroundColor: "rgba(212,224,249,0.18)",
  },
  cdImage: { width: 160, height: 160 },
  songName: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
    textAlign: "center",
  },
  songArtist: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  songUnderline: {
    width: "80%",
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginVertical: 2,
  },
  metaCard: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(108,118,144,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaLine: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 14,
    lineHeight: 18,
  },
  metaLabelText: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 15,
    lineHeight: 18,
  },
  metaValueText: { color: colors.text },
  spotifyBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
  },
  spotifyBtnText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    fontWeight: "800",
  },

  // Transport controls
  transport: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 4,
    width: "100%",
  },
  transportBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    alignItems: "center",
    justifyContent: "center",
  },
  transportIcon: {
    color: colors.border,
    fontSize: 20,
    lineHeight: 24,
  },
  transportPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.accent,
    backgroundColor: colors.button,
    alignItems: "center",
    justifyContent: "center",
  },
  transportPlayIcon: {
    color: colors.accent,
    fontSize: 26,
    lineHeight: 30,
  },

  // Song list
  listPanel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  listContent: { padding: 16, gap: 8 },
  listTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 4,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    minHeight: 54,
  },
  songRowSelected: {
    backgroundColor: "rgba(117,82,107,0.22)",
    borderColor: colors.accent,
  },
  songRank: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 14,
    minWidth: 22,
  },
  songTextBlock: { flex: 1, gap: 1 },
  songRowTitle: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 14,
    lineHeight: 17,
  },
  songRowArtist: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
  },
  songTextActive: { color: colors.text },
  songCd: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  songCdImg: { width: 40, height: 40 },
});