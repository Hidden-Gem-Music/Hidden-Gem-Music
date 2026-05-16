import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  year: number;
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  countries: Country[];
};

function DashboardSection({ children }: { children: React.ReactNode }) {
  return (
    <Panel style={styles.sectionPanel}>
      <SecondarySurfaceFill />
      <View style={styles.sectionContent}>{children}</View>
    </Panel>
  );
}

function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Panel style={styles.kpiCard}>
      <LinearGradient
        colors={[colors.backgroundSoft, "#74819B", "#70536A"]}
        locations={[0, 0.38, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.kpiFill}
      />
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiDetail}>{detail}</Text>
    </Panel>
  );
}

export function DashboardScreen({ year, metrics, countries }: Props) {
  const topCountries = countries.slice(0, 5);

  return (
    <ScreenScaffold>
      <View style={styles.screen}>
        <DiscoveryBlurb
          heading="Discovery Dashboard"
          body={`This dashboard summarizes discovery behavior for ${year}, including overlap, isolation, and hidden gem concentration across countries.`}
        />

        <DashboardSection>
          <Text style={styles.sectionLabel}>KEY PERFORMANCE INDICATORS</Text>
          <View style={styles.kpiGrid}>
            {metrics.map((metric) => (
              <KpiCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
            ))}
          </View>
        </DashboardSection>

        <DashboardSection>
          <Text style={styles.sectionLabel}>TREND ANALYSIS</Text>
          <Text style={styles.sectionTitle}>Regional Isolation Scores</Text>
          <Text style={styles.sectionBody}>
            Countries with higher isolation scores have a larger share of songs that stay local rather than crossing into
            other markets.
          </Text>
          <View style={styles.countryList}>
            {topCountries.map((country, index) => (
              <View key={`${country.id}-${index}`} style={styles.countryRow}>
                <Text style={styles.countryName}>{country.name}</Text>
                <Text style={styles.countryMeta}>{country.region}</Text>
              </View>
            ))}
          </View>
        </DashboardSection>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 12,
  },
  sectionPanel: {
    padding: 0,
    overflow: "hidden",
  },
  sectionContent: {
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  sectionTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 25,
    lineHeight: 29,
  },
  sectionBody: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 21,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    width: "48%",
    minWidth: 150,
    padding: 10,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "transparent",
    gap: 4,
  },
  kpiFill: {
    ...StyleSheet.absoluteFillObject,
  },
  kpiLabel: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 15,
  },
  kpiValue: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 25,
    lineHeight: 29,
  },
  kpiDetail: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 14,
  },
  countryList: {
    gap: 8,
  },
  countryRow: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: "rgba(108,118,144,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countryName: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 17,
    lineHeight: 21,
  },
  countryMeta: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 16,
  },
});
