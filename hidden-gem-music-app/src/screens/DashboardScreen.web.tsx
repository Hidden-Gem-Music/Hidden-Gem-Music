import { StyleSheet, Text, View } from "react-native";

import { Country } from "../types/content";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  year: number;
  metrics: Array<{ label: string; value: string; detail: string }>;
  countries: Country[];
};

export function DashboardScreen({ year, metrics, countries }: Props) {
  return (
    <ScreenScaffold>
      {/* Issue #6 shell: dashboard scaffold with KPI summary areas is in place.
          Chart placeholders and expanded overlap-specific visuals will attach here next. */}
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Current yearly slice: {year}</Text>
      <View style={styles.metricRow}>
        {metrics.map((metric) => (
          <Panel key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.copy}>{metric.detail}</Text>
          </Panel>
        ))}
      </View>
      <Panel style={styles.panel}>
        <Text style={styles.sectionHeading}>Countries In View</Text>
        <Text style={styles.copy}>{countries.map((country) => country.name).join(", ")}</Text>
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
  subtitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 18,
  },
  metricRow: {
    flexDirection: "row",
    gap: 18,
    flexWrap: "wrap",
  },
  metricCard: {
    flex: 1,
    minWidth: 240,
    gap: 10,
  },
  metricLabel: {
    color: colors.textMuted,
    fontFamily: typefaces.body,
    fontSize: 16,
  },
  metricValue: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 42,
  },
  panel: {
    minHeight: 260,
    gap: 14,
  },
  sectionHeading: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 22,
  },
  copy: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 24,
    lineHeight: 38,
  },
});
