import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
 
import { ActionButton } from "../components/ActionButton";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { YearSelector } from "../components/YearSelector";
import { getSongsForCountryYear } from "../data/mockData";
import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
 
export type Props = {
  countries: Country[];
  availableCountries: Country[];
  selectedYear: number;
  onBack: () => void;
  onChangeYear: (year: number) => void;
  onChangeCountryAtIndex: (index: number, countryId: string) => void;
  onOpenCountry: (countryId: string) => void;
  onOpenHiddenGemsForCountry: (
    countryId: string,
    selection?: { songTitle?: string; artist?: string }
  ) => void;
};
 
const carouselBackdropColors = ["#B86A72", "#8B9BC0", "#8B5E7A", "#627F8A", "#C28C5E", "#7A7EB0"];
const cdCaseSource = require("../assets/images/CD-Case-Transparent-Image.png");
 
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}
function createBreakdown(labels: string[], seed: number) {
  const safe = labels.length > 0 ? labels : ["No Data"];
  const w = safe.map((_, i) => ((seed + i * 17) % 23) + 10);
  const total = w.reduce((s, x) => s + x, 0);
  let run = 0;
  return safe.map((label, i) => {
    const last = i === safe.length - 1;
    const p = last ? 100 - run : Math.round((w[i] / total) * 100);
    run += p;
    return { label, percent: p };
  });
}
 
function StatSquare({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Panel style={styles.statSquare}>
      <SecondarySurfaceFill />
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statNote}>{note}</Text>
      </View>
    </Panel>
  );
}
 
function GenreBar({ label, percent }: { label: string; percent: number }) {
  return (
    <View style={styles.genreRow}>
      <Text style={styles.genreLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.genreTrack}>
        <View style={[styles.genreFill, { width: `${percent}%` as any }]} />
      </View>
      <Text style={styles.genreValue}>{percent}%</Text>
    </View>
  );
}
 
function CountryPane({
  country,
  otherCountryId,
  availableCountries,
  selectedYear,
  onChangeYear,
  onChangeCountry,
  onOpenCountry,
  onOpenHiddenGems,
}: {
  country: Country;
  otherCountryId?: string;
  availableCountries: Country[];
  selectedYear: number;
  onChangeYear: (year: number) => void;
  onChangeCountry: (id: string) => void;
  onOpenCountry: (id: string) => void;
  onOpenHiddenGems: (sel?: { songTitle?: string; artist?: string }) => void;
}) {
  const seed = hashString(`${country.code}-${selectedYear}`);
  const totalCharted = clamp(56 + (seed % 28) + country.hiddenSongs + country.genres.length * 8, 60, 128);
  const overlapPercent = clamp(42 + (seed % 24) + country.genres.length * 2, 36, 82);
  const sharedCount = Math.round(totalCharted * (overlapPercent / 100));
  const uniqueCount = totalCharted - sharedCount;
  const genreBreakdown = useMemo(() => createBreakdown(country.genres, seed + 13), [country.genres, seed]);
  const langBreakdown = useMemo(() => createBreakdown(country.languages, seed + 41), [country.languages, seed]);
  const hiddenGemSongs = useMemo(() => getSongsForCountryYear(country.id, selectedYear), [country.id, selectedYear]);
  const countryOptions = useMemo(
    () => availableCountries.filter((c) => c.id === country.id || c.id !== otherCountryId),
    [availableCountries, country.id, otherCountryId]
  );
 
  return (
    <Panel style={styles.pane}>
      <LinearGradient
        colors={[colors.surfaceSecondary, "#27293B", "#332E41", "#4A3E51", "#70536A"]}
        locations={[0, 0.34, 0.62, 0.84, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.paneFill}
      />
      <View style={styles.paneContent}>
        {/* Header */}
        <View style={styles.paneHeader}>
          <View style={styles.paneHeaderCopy}>
            <Pressable onPress={() => onOpenCountry(country.id)}>
              <Text style={styles.paneTitle}>{country.name}</Text>
            </Pressable>
            <Text style={styles.paneSubtitle}>{country.region}</Text>
          </View>
          <YearSelector year={selectedYear} onSelectYear={onChangeYear} compact compactArrows smallLabel />
        </View>
 
        {/* Summary */}
        <Panel style={styles.summaryPanel}>
          <LinearGradient
            colors={[colors.backgroundSoft, "#74819B", "#70536A"]}
            locations={[0, 0.38, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>Country Summary</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>General Description</Text>
              <View style={styles.underline} />
              <Text style={styles.summaryCardText}>{country.sceneNote}</Text>
            </View>
          </View>
        </Panel>
 
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatSquare label="Songs" value={`${totalCharted}`} note="total" />
          <StatSquare label="Unique" value={`${uniqueCount}`} note="songs" />
          <StatSquare label="Shared" value={`${sharedCount}`} note="songs" />
          <StatSquare label="Overlap" value={`${overlapPercent}%`} note="%" />
        </View>
 
        {/* Genres */}
        <Panel style={styles.genrePanel}>
          <LinearGradient
            colors={[colors.backgroundSoft, "#74819B", "#5D6983", colors.backgroundBottom]}
            locations={[0, 0.48, 0.82, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.genreContent}>
            <Text style={styles.genreTitle}>Loved Genres</Text>
            {genreBreakdown.map((item) => (
              <GenreBar key={item.label} label={item.label} percent={item.percent} />
            ))}
          </View>
        </Panel>
 
        {/* Languages */}
        <Panel style={styles.genrePanel}>
          <LinearGradient
            colors={[colors.backgroundSoft, "#74819B", "#5D6983", colors.backgroundBottom]}
            locations={[0, 0.48, 0.82, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.genreContent}>
            <Text style={styles.genreTitle}>Languages</Text>
            {langBreakdown.map((item) => (
              <GenreBar key={item.label} label={item.label} percent={item.percent} />
            ))}
          </View>
        </Panel>
 
        {/* Hidden Gems Preview */}
        {hiddenGemSongs.slice(0, 6).map((song, i) => (
          <Pressable
            key={song.id}
            onPress={() => onOpenHiddenGems({ songTitle: song.title, artist: song.artist })}
            style={({ pressed }) => [styles.songRow, pressed ? styles.songRowPressed : null]}
          >
            <Text style={styles.songRank}>{i + 1}.</Text>
            <View style={styles.songCopy}>
              <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
            </View>
            <View style={[styles.cdBadge, { backgroundColor: carouselBackdropColors[i % carouselBackdropColors.length] }]}>
              <Image source={cdCaseSource} style={styles.cdBadgeImg} resizeMode="contain" />
            </View>
          </Pressable>
        ))}
 
        <Pressable onPress={() => onOpenHiddenGems()} style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>View all hidden gems →</Text>
        </Pressable>
      </View>
    </Panel>
  );
}
 
function EmptyPane({ label }: { label: string }) {
  return (
    <Panel style={styles.pane}>
      <LinearGradient
        colors={[colors.surfaceSecondary, "#27293B", "#332E41", "#4A3E51", "#70536A"]}
        locations={[0, 0.34, 0.62, 0.84, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.paneFill}
      />
      <View style={styles.emptyPane}>
        <GemIcon size={32} />
        <Text style={styles.emptyTitle}>{label}</Text>
        <Text style={styles.emptyBody}>Go back to select a country for this slot.</Text>
      </View>
    </Panel>
  );
}
 
export function ComparisonResultsScreen({
  countries,
  availableCountries,
  selectedYear,
  onBack,
  onChangeYear,
  onChangeCountryAtIndex,
  onOpenCountry,
  onOpenHiddenGemsForCountry,
}: Props) {
  const leftCountry = countries[0];
  const rightCountry = countries[1];
 
  return (
    <ScreenScaffold>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <ActionButton label="← Back" size="compact" onPress={onBack} />
        </View>
 
        {/* Left pane */}
        {leftCountry ? (
          <CountryPane
            country={leftCountry}
            otherCountryId={rightCountry?.id}
            availableCountries={availableCountries}
            selectedYear={selectedYear}
            onChangeYear={onChangeYear}
            onChangeCountry={(id) => onChangeCountryAtIndex(0, id)}
            onOpenCountry={onOpenCountry}
            onOpenHiddenGems={(sel) => onOpenHiddenGemsForCountry(leftCountry.id, sel)}
          />
        ) : (
          <EmptyPane label="No Country Selected" />
        )}
 
        {/* Divider */}
        <View style={styles.paneDivider}>
          <GemIcon size={20} />
        </View>
 
        {/* Right pane */}
        {rightCountry ? (
          <CountryPane
            country={rightCountry}
            otherCountryId={leftCountry?.id}
            availableCountries={availableCountries}
            selectedYear={selectedYear}
            onChangeYear={onChangeYear}
            onChangeCountry={(id) => onChangeCountryAtIndex(1, id)}
            onOpenCountry={onOpenCountry}
            onOpenHiddenGems={(sel) => onOpenHiddenGemsForCountry(rightCountry.id, sel)}
          />
        ) : (
          <EmptyPane label="No Country Selected" />
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}
 
const styles = StyleSheet.create({
  scrollContent: { gap: 16, paddingBottom: 32 },
  topBar: { flexDirection: "row", justifyContent: "flex-start" },
  pane: { backgroundColor: "transparent", overflow: "hidden", padding: 0 },
  paneFill: { ...StyleSheet.absoluteFillObject },
  paneContent: { padding: 16, gap: 14 },
  paneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  paneHeaderCopy: { flex: 1, gap: 2 },
  paneTitle: { color: colors.textStrong, fontFamily: typefaces.display, fontSize: 32, lineHeight: 36 },
  paneSubtitle: { color: colors.text, fontFamily: typefaces.body, fontSize: 14, lineHeight: 18 },
  summaryPanel: { backgroundColor: "transparent", overflow: "hidden", padding: 0 },
  summaryContent: { padding: 14, gap: 10 },
  summaryTitle: { color: colors.border, fontFamily: typefaces.display, fontSize: 18, lineHeight: 22 },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.12)",
    padding: 12,
    gap: 6,
  },
  summaryCardTitle: { color: colors.border, fontFamily: typefaces.display, fontSize: 15, lineHeight: 18 },
  underline: { height: 2, borderRadius: 999, backgroundColor: colors.accent, opacity: 0.9 },
  summaryCardText: { color: colors.border, fontFamily: typefaces.body, fontSize: 13, lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: 8 },
  statSquare: {
    flex: 1,
    minHeight: 80,
    borderWidth: 2,
    borderColor: "rgba(117,82,107,0.42)",
    backgroundColor: "transparent",
    overflow: "hidden",
    padding: 0,
  },
  statContent: { padding: 10, gap: 2 },
  statLabel: { color: colors.text, fontFamily: typefaces.body, fontSize: 9, lineHeight: 11 },
  statValue: { color: colors.textStrong, fontFamily: typefaces.display, fontSize: 20, lineHeight: 24 },
  statNote: { color: colors.text, fontFamily: typefaces.body, fontSize: 9, lineHeight: 11 },
  genrePanel: { backgroundColor: "transparent", overflow: "hidden", padding: 0 },
  genreContent: { padding: 12, gap: 8 },
  genreTitle: { color: colors.border, fontFamily: typefaces.display, fontSize: 16, lineHeight: 20 },
  genreRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  genreLabel: { width: 80, color: colors.border, fontFamily: typefaces.body, fontSize: 12, lineHeight: 14 },
  genreTrack: {
    flex: 1, height: 12, borderRadius: 999, overflow: "hidden",
    borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(15,16,21,0.38)",
  },
  genreFill: { height: "100%", borderRadius: 999, backgroundColor: colors.backgroundSoft },
  genreValue: { width: 32, textAlign: "right", color: colors.border, fontFamily: typefaces.body, fontSize: 11 },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.16)",
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    minHeight: 56,
  },
  songRowPressed: { opacity: 0.7 },
  songRank: { color: colors.border, fontFamily: typefaces.display, fontSize: 13, minWidth: 18 },
  songCopy: { flex: 1, gap: 2 },
  songTitle: { color: colors.border, fontFamily: typefaces.display, fontSize: 14, lineHeight: 17 },
  songArtist: { color: colors.border, fontFamily: typefaces.condensed, fontSize: 11, fontWeight: "700", lineHeight: 13 },
  cdBadge: { width: 40, height: 40, borderRadius: 6, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  cdBadgeImg: { width: 40, height: 40 },
  viewAllBtn: { paddingVertical: 8, alignItems: "center" },
  viewAllText: { color: colors.accent, fontFamily: typefaces.body, fontSize: 13, textDecorationLine: "underline" },
  paneDivider: { alignItems: "center", paddingVertical: 4 },
  emptyPane: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  emptyTitle: { color: colors.textStrong, fontFamily: typefaces.display, fontSize: 26, textAlign: "center" },
  emptyBody: { color: colors.text, fontFamily: typefaces.body, fontSize: 15, lineHeight: 20, textAlign: "center" },
});