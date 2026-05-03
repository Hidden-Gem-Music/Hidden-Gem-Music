import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo, ReactNode} from "react";
 
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
 
export type Props = {
  year: number;
  metrics: Array<{ label: string; value: string; detail: string }>;
  countries: Country[];
};
 
function DashboardSection({
  children,
  fillVariant = "default",
  style,
}: {
  children: ReactNode;
  fillVariant?: "default" | "softBlue" | "comparisonBlue";
  style?: object;
}) {
  return (
    <Panel style={[styles.section, style]}>
      {fillVariant === "softBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#5D6983", colors.backgroundBottom]}
          locations={[0, 0.48, 0.82, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sectionFill}
        />
      ) : fillVariant === "comparisonBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#70536A"]}
          locations={[0, 0.38, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sectionFill}
        />
      ) : (
        <SecondarySurfaceFill />
      )}
      <View style={styles.sectionContent}>{children}</View>
    </Panel>
  );
}
 
function SectionTitle({ title, subtitle, darkText = false }: { title: string; subtitle?: string; darkText?: boolean }) {
  return (
    <View style={styles.titleWrap}>
      <Text style={[styles.sectionTitle, darkText ? styles.darkTitle : null]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, darkText ? styles.darkSubtitle : null]}>{subtitle}</Text> : null}
    </View>
  );
}
 
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Panel style={styles.statCard}>
      <SecondarySurfaceFill />
      <View style={styles.statCardContent}>
        <Text style={styles.statCardValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={styles.statCardLabel} numberOfLines={2}>{label}</Text>
      </View>
    </Panel>
  );
}
 
function HorizontalBar({ label, percent, darkText = false }: { label: string; percent: number; darkText?: boolean }) {
  return (
    <View style={styles.hBarRow}>
      <Text style={[styles.hBarLabel, darkText ? styles.darkBarLabel : null]}>{label}</Text>
      <View style={styles.hBarTrack}>
        <View style={[styles.hBarFill, { width: `${percent}%` as any }]} />
      </View>
    </View>
  );
}
 
function RankRow({ rank, label, value }: { rank: number; label: string; value: string }) {
  return (
    <View style={styles.rankRow}>
      <Text style={styles.rankNum}>{rank}</Text>
      <Text style={styles.rankLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.rankValue}>{value}</Text>
    </View>
  );
}
 
export function DashboardScreen({ year, metrics, countries }: Props) {
  const statItems = useMemo(
    () => [
      { label: metrics[0]?.label ?? "Countries", value: metrics[0]?.value ?? `${countries.length}` },
      { label: metrics[1]?.label ?? "Hidden Songs", value: metrics[1]?.value ?? "0" },
      { label: "Current Year", value: `${year}` },
      { label: "Genre Buckets", value: "12" },
      { label: "Language Buckets", value: "9" },
      { label: "Busiest Region", value: "87" },
    ],
    [countries.length, metrics, year]
  );
 
  const featuredItems = ["Featured Thing 1", "Featured Thing 2", "Featured Thing 3", "Featured Thing 4", "Featured Thing 5", "Featured Thing 6"];
 
  return (
    <ScreenScaffold>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DiscoveryBlurb
          heading="Dashboard"
          body="An overview of the data, trends, and key stats across all countries and years in this app."
        />
 
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {statItems.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} />
          ))}
        </View>
 
        {/* Bar chart placeholder */}
        <DashboardSection fillVariant="comparisonBlue">
          <SectionTitle title="Global Trend Overview" subtitle={`Placeholder chart for ${year}`} darkText />
          {[
            { label: "Item 1", percent: 88 },
            { label: "Item 2", percent: 72 },
            { label: "Item 3", percent: 61 },
            { label: "Item 4", percent: 48 },
            { label: "Item 5", percent: 37 },
          ].map((item) => (
            <HorizontalBar key={item.label} label={item.label} percent={item.percent} darkText />
          ))}
        </DashboardSection>
 
        {/* Featured items */}
        <DashboardSection fillVariant="softBlue">
          <SectionTitle title="Featured Things" subtitle="Placeholder featured item set" darkText />
          <View style={styles.chipRow}>
            {featuredItems.map((item) => (
              <View key={item} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
              </View>
            ))}
          </View>
        </DashboardSection>
 
        {/* Two-column: ranked list + matrix */}
        <View style={styles.twoCol}>
          <DashboardSection style={styles.halfSection}>
            <SectionTitle title="Top Rankings" subtitle="Placeholder ranked list" />
            {["List Item A", "List Item B", "List Item C", "List Item D", "List Item E"].map((label, i) => (
              <RankRow key={label} rank={i + 1} label={label} value={`${92 - i * 7}%`} />
            ))}
          </DashboardSection>
 
          <DashboardSection fillVariant="comparisonBlue" style={styles.halfSection}>
            <SectionTitle title="Dot Grid" subtitle="Placeholder grid data" darkText />
            <View style={styles.matrixGrid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View key={i} style={[styles.matrixCell, { opacity: 0.28 + (i % 3) * 0.2 }]} />
              ))}
            </View>
          </DashboardSection>
        </View>
 
        {/* Placeholder card grid */}
        <DashboardSection>
          <SectionTitle title="Overview Cards" subtitle="Placeholder dashboard modules" />
          <View style={styles.cardGrid}>
            {["Card A", "Card B", "Card C"].map((label) => (
              <View key={label} style={styles.placeholderCard}>
                <Text style={styles.cardTitle}>{label}</Text>
                <View style={styles.cardLine} />
                <View style={[styles.cardLine, { width: "72%" }]} />
                <View style={[styles.cardLine, { width: "48%" }]} />
              </View>
            ))}
          </View>
        </DashboardSection>
      </ScrollView>
    </ScreenScaffold>
  );
}
 
const styles = StyleSheet.create({
  scrollContent: { gap: 16, paddingBottom: 32 },
  section: { backgroundColor: "transparent", padding: 0, overflow: "hidden" },
  sectionFill: { ...StyleSheet.absoluteFillObject },
  sectionContent: { padding: 16, gap: 12 },
  titleWrap: { gap: 4 },
  sectionTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  darkTitle: { color: "rgba(15,16,21,0.92)" },
  sectionSubtitle: { color: colors.text, fontFamily: typefaces.body, fontSize: 13, lineHeight: 18 },
  darkSubtitle: { color: "rgba(15,16,21,0.8)" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "30%",
    flexGrow: 1,
    minHeight: 88,
    borderWidth: 2,
    borderColor: "rgba(117,82,107,0.42)",
    backgroundColor: "transparent",
    overflow: "hidden",
    padding: 0,
  },
  statCardContent: {
    flex: 1,
    padding: 10,
    gap: 4,
    justifyContent: "space-between",
  },
  statCardValue: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 26,
    lineHeight: 30,
    textAlign: "center",
  },
  statCardLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
  },
  hBarRow: { gap: 6 },
  hBarLabel: { color: colors.text, fontFamily: typefaces.body, fontSize: 12, lineHeight: 16 },
  darkBarLabel: { color: "rgba(15,16,21,0.82)" },
  hBarTrack: {
    width: "100%",
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(15,16,21,0.24)",
  },
  hBarFill: { height: "100%", borderRadius: 999, backgroundColor: colors.backgroundSoft },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { color: "rgba(15,16,21,0.88)", fontFamily: typefaces.body, fontSize: 13, lineHeight: 18 },
  twoCol: { gap: 12 },
  halfSection: {},
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rankNum: { width: 22, color: colors.textStrong, fontFamily: typefaces.display, fontSize: 16, lineHeight: 18 },
  rankLabel: { flex: 1, color: colors.textStrong, fontFamily: typefaces.body, fontSize: 13, lineHeight: 17 },
  rankValue: { color: colors.text, fontFamily: typefaces.body, fontSize: 12, lineHeight: 17 },
  matrixGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  matrixCell: {
    width: "30%",
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.textStrong,
  },
  cardGrid: { gap: 10 },
  placeholderCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.16)",
    padding: 14,
    gap: 10,
    minHeight: 110,
  },
  cardTitle: { color: colors.textStrong, fontFamily: typefaces.display, fontSize: 18, lineHeight: 22 },
  cardLine: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(108,119,142,0.42)",
  },
});