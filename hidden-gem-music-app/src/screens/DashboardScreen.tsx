import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type MetricValue = {
  label: string;
  value: string;
};

export type Props = {
  year: number;
  metrics: {
    overlap: number;
    hiddenGemCount: number;
    averageTempo: number;
    countries: number;
  };
  countries: Country[];
};

function StatCard({ label, value }: MetricValue) {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[colors.backgroundSoft, "#74819B", "#7A4762"]}
        locations={[0, 0.38, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.statCardFill}
      />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function DashboardScreen({ year, metrics, countries }: Props) {
  const topCountries = countries.slice(0, 5).map((country) => country.name);

  return (
    <ScreenScaffold>
      <View style={styles.screen}>
        <Panel style={styles.section}>
          <SecondarySurfaceFill />
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>{`Global snapshot for ${year}`}</Text>
        </Panel>

        <Panel style={styles.section}>
          <SecondarySurfaceFill />
          <Text style={styles.sectionTitle}>Regional Isolation Scores</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Global Overlap" value={`${Math.round(metrics.overlap)}%`} />
            <StatCard label="Hidden Gems" value={`${metrics.hiddenGemCount}`} />
            <StatCard label="Avg Tempo" value={`${Math.round(metrics.averageTempo)} BPM`} />
            <StatCard label="Countries" value={`${metrics.countries}`} />
          </View>
        </Panel>

        <Panel style={styles.section}>
          <SecondarySurfaceFill />
          <Text style={styles.sectionTitle}>Country Highlights</Text>
          <View style={styles.list}>
            {topCountries.length > 0 ? (
              topCountries.map((name, index) => (
                <Text key={`${name}-${index}`} style={styles.listItem}>{`• ${name}`}</Text>
              ))
            ) : (
              <Text style={styles.listItem}>• Loading...</Text>
            )}
          </View>
        </Panel>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 12,
  },
  section: {
    padding: 0,
    overflow: "hidden",
  },
  title: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 36,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48%",
    minWidth: 150,
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  statCardFill: {
    ...StyleSheet.absoluteFillObject,
  },
  statValue: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  statLabel: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 13,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 6,
  },
  list: {
    gap: 8,
  },
  listItem: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 17,
    lineHeight: 22,
  },
});
