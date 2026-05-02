import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useMemo, ReactNode, useState } from "react";
 
import { Country, Song } from "../types/content";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { YearSelector } from "../components/YearSelector";
import { getSongsForCountryYear } from "../data/mockData";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
 
export type Props = {
  country: Country;
  countries: Country[];
  onSelectCountry: (countryId: string) => void;
  onOpenHiddenGems: (selection?: { songTitle?: string; artist?: string }) => void;
  onOpenComparisonMode: () => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};
 
const carouselBackdropColors = ["#B86A72", "#8B9BC0", "#8B5E7A", "#627F8A", "#C28C5E", "#7A7EB0"];
const cdCaseSource = require("../assets/images/CD-Case-Transparent-Image.png");
 
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}
function createPercentBreakdown(labels: string[], seed: number) {
  const safeLabels = labels.length > 0 ? labels : ["No Data"];
  const weights = safeLabels.map((_, i) => ((seed + i * 17) % 23) + 10);
  const total = weights.reduce((s, w) => s + w, 0);
  let running = 0;
  return safeLabels.map((label, i) => {
    const isLast = i === safeLabels.length - 1;
    const percent = isLast ? 100 - running : Math.round((weights[i] / total) * 100);
    running += percent;
    return { label, percent };
  });
}
 
function SectionPanel({
  children,
  style,
  fillVariant = "default",
  contentStyle,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  fillVariant?: "default" | "comparisonBlue" | "softBlue";
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <Panel style={[styles.sectionPanel, style]}>
      {fillVariant === "comparisonBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#70536A"]}
          locations={[0, 0.38, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sectionFill}
        />
      ) : fillVariant === "softBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#5D6983", colors.backgroundBottom]}
          locations={[0, 0.48, 0.82, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sectionFill}
        />
      ) : (
        <SecondarySurfaceFill />
      )}
      <View style={[styles.sectionContent, contentStyle]}>{children}</View>
    </Panel>
  );
}
 
function StatSquare({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <SectionPanel style={styles.statSquare}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statNote}>{note}</Text>
    </SectionPanel>
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
 
function SongRow({
  song,
  index,
  onPress,
}: {
  song: { title: string; artist: string };
  index: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.songRow, pressed ? styles.songRowPressed : null]}>
      <View style={styles.songRowInner}>
        <Text style={styles.songRank}>{index + 1}.</Text>
        <View style={styles.songCopy}>
          <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
        </View>
        <View style={[styles.songCdBadge, { backgroundColor: carouselBackdropColors[index % carouselBackdropColors.length] }]}>
          <Image source={cdCaseSource} style={styles.songCdImage} resizeMode="contain" />
        </View>
      </View>
    </Pressable>
  );
}
 
export function CountryScreen({
  country,
  countries,
  onSelectCountry,
  onOpenHiddenGems,
  onOpenComparisonMode,
  selectedYear,
  onChangeYear,
}: Props) {
  const seed = hashString(`${country.code}-${selectedYear}`);
  const totalCharted = clamp(56 + (seed % 28) + country.hiddenSongs + country.genres.length * 8, 60, 128);
  const overlapPercent = clamp(42 + (seed % 24) + country.genres.length * 2, 36, 82);
  const sharedCount = Math.round(totalCharted * (overlapPercent / 100));
  const uniqueCount = totalCharted - sharedCount;
  const genreBreakdown = useMemo(() => createPercentBreakdown(country.genres, seed + 13), [country.genres, seed]);
  const langBreakdown = useMemo(() => createPercentBreakdown(country.languages, seed + 41), [country.languages, seed]);
  const hiddenGemSongs = useMemo(() => getSongsForCountryYear(country.id, selectedYear), [country.id, selectedYear]);
 
  const leadArtist = country.featuredArtists[0] ?? country.albumArtist;
  const previewSongs = hiddenGemSongs.slice(0, 8).map((s, i) => ({
    title: s.title,
    artist: s.artist,
  }));
 
  return (
    <ScreenScaffold>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.pageTitle}>{country.name}</Text>
            <Text style={styles.pageSubtitle}>{country.region}</Text>
          </View>
          <YearSelector year={selectedYear} onSelectYear={onChangeYear} compact compactArrows smallLabel />
        </View>
 
        {/* Summary */}
        <SectionPanel fillVariant="comparisonBlue">
          <Text style={styles.sectionTitle}>Country Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>General Description</Text>
            <View style={styles.underline} />
            <Text style={styles.summaryCardText}>{country.sceneNote}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Genre + Language Mix</Text>
            <View style={styles.underline} />
            <Text style={styles.summaryCardText}>
              {country.name}'s chart leans through {country.genres.join(", ")}, and includes{" "}
              {country.languages.join(", ")}.
            </Text>
          </View>
        </SectionPanel>
 
        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatSquare label="Songs in View" value={`${totalCharted}`} note="songs" />
          <StatSquare label="Loved Here" value={`${uniqueCount}`} note="songs" />
          <StatSquare label="Shared" value={`${sharedCount}`} note="songs" />
          <StatSquare label="Overlap" value={`${overlapPercent}%`} note="%" />
        </View>
 
        {/* Genres */}
        <SectionPanel fillVariant="softBlue">
          <Text style={styles.sectionTitle}>{country.name}'s Loved Genres</Text>
          {genreBreakdown.map((item) => (
            <GenreBar key={item.label} label={item.label} percent={item.percent} />
          ))}
        </SectionPanel>
 
        {/* Languages */}
        <SectionPanel fillVariant="softBlue">
          <Text style={styles.sectionTitle}>{country.name}'s Languages</Text>
          {langBreakdown.map((item) => (
            <GenreBar key={item.label} label={item.label} percent={item.percent} />
          ))}
        </SectionPanel>
 
        {/* Featured Artists */}
        <SectionPanel>
          <Text style={styles.sectionTitle}>{country.name}'s Favorite Artists in {selectedYear}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistRow}>
            {country.featuredArtists.slice(0, 6).map((artist, i) => (
              <Pressable key={`${artist}-${i}`} onPress={() => onOpenHiddenGems({ artist })} style={styles.artistItem}>
                <View style={[styles.artistCd, { backgroundColor: carouselBackdropColors[i % carouselBackdropColors.length] }]}>
                  <Image source={cdCaseSource} style={styles.artistCdImage} resizeMode="contain" />
                </View>
                <Text style={styles.artistName} numberOfLines={2}>{artist}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </SectionPanel>
 
        {/* Hidden Songs Preview */}
        {previewSongs.length > 0 && (
          <SectionPanel>
            <Text style={styles.sectionTitle}>Preview {country.name}'s Hidden Gems</Text>
            {previewSongs.map((song, i) => (
              <SongRow
                key={`${song.title}-${i}`}
                song={song}
                index={i}
                onPress={() => onOpenHiddenGems({ songTitle: song.title, artist: song.artist })}
              />
            ))}
            <Pressable onPress={() => onOpenHiddenGems()} style={styles.viewAllBtn}>
              <Text style={styles.viewAllBtnText}>View all of {country.name}'s hidden gems →</Text>
            </Pressable>
          </SectionPanel>
        )}
 
        {/* Comparison CTA */}
        <Pressable onPress={onOpenComparisonMode} style={({ pressed }) => [styles.comparisonCta, pressed ? styles.comparisonCtaPressed : null]}>
          <LinearGradient
            colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.72)"]}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.comparisonCtaFill}
          />
          <View style={styles.comparisonCtaInner}>
            <GemIcon size={16} />
            <Text style={styles.comparisonCtaText}>
              <Text style={styles.comparisonCtaLead}>Compare two countries </Text>
              <Text style={styles.comparisonCtaBody}>— tap here to open Comparison Mode</Text>
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenScaffold>
  );
}
 
const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  pageTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 38,
    lineHeight: 42,
  },
  pageSubtitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 20,
  },
  sectionPanel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  sectionFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionContent: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.12)",
    padding: 12,
    gap: 8,
  },
  summaryCardTitle: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 16,
    lineHeight: 20,
  },
  underline: {
    height: 2,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.9,
    alignSelf: "stretch",
  },
  summaryCardText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statSquare: {
    flex: 1,
    minHeight: 96,
    borderWidth: 2,
    borderColor: "rgba(117,82,107,0.42)",
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  statLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 10,
    lineHeight: 13,
  },
  statValue: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  statNote: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 10,
    lineHeight: 13,
  },
  genreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  genreLabel: {
    width: 90,
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
  },
  genreTrack: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(15,16,21,0.38)",
  },
  genreFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.backgroundSoft,
  },
  genreValue: {
    width: 36,
    textAlign: "right",
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 16,
  },
  artistRow: {
    gap: 14,
    paddingBottom: 4,
  },
  artistItem: {
    alignItems: "center",
    width: 88,
    gap: 8,
  },
  artistCd: {
    width: 72,
    height: 72,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  artistCdImage: {
    width: 72,
    height: 72,
  },
  artistName: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
  songRow: {
    borderRadius: 14,
    overflow: "hidden",
  },
  songRowPressed: {
    opacity: 0.7,
  },
  songRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.16)",
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    minHeight: 62,
  },
  songRank: {
    color: colors.text,
    fontFamily: typefaces.display,
    fontSize: 14,
    lineHeight: 16,
    minWidth: 22,
  },
  songCopy: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 15,
    lineHeight: 18,
  },
  songArtist: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
  },
  songCdBadge: {
    width: 44,
    height: 44,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  songCdImage: {
    width: 44,
    height: 44,
  },
  viewAllBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  viewAllBtnText: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
    textDecorationLine: "underline",
  },
  comparisonCta: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
  },
  comparisonCtaPressed: {
    opacity: 0.75,
  },
  comparisonCtaFill: {
    ...StyleSheet.absoluteFillObject,
  },
  comparisonCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  comparisonCtaText: {
    flex: 1,
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
  },
  comparisonCtaLead: {
    fontFamily: typefaces.display,
    fontSize: 17,
    lineHeight: 20,
  },
  comparisonCtaBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});