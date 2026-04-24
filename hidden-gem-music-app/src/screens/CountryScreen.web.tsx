import { StyleSheet, Text, View } from "react-native";

import { Country } from "../types/content";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { YearSelector } from "../components/YearSelector";
import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  country: Country;
  onNavigate: (route: ScreenRoute) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

export function CountryScreen({ country, onNavigate, selectedYear, onChangeYear }: Props) {
  return (
    <>
        <h1 style={styles.title}>{country.name} Test</h1>
        <h2 style={styles.region}>{country.region}</h2>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
  },
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 60,
    fontWeight: "700",
  },
  region: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "right",
  },
  largePanel: {
    minHeight: 820,
    gap: 24,
  },
  heroRow: {
    flexDirection: "row",
    gap: 18,
    flexWrap: "wrap",
  },
  metricBlock: {
    flex: 1,
    minWidth: 260,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    padding: 22,
    gap: 8,
  },
  metricLabel: {
    color: colors.textMuted,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 48,
    fontWeight: "700",
  },
  metricValueSmall: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
  },
  innerPanel: {
    backgroundColor: colors.surfaceSecondary,
    gap: 18,
    minHeight: 460,
  },
  sectionHeading: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 24,
    fontWeight: "800",
  },
  placeholderCopy: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 30,
    maxWidth: 720,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
});
