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
    <ScreenScaffold>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{country.name}</Text>
        <Text style={styles.region}>{country.region}</Text>
      </View>
      <Panel style={styles.largePanel}>
        <YearSelector label="Display Data For Year" year={selectedYear} onSelectYear={onChangeYear} />
        <View style={styles.heroRow}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Hidden Songs</Text>
            <Text style={styles.metricValue}>{country.hiddenSongs}</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Top Genres</Text>
            <Text style={styles.metricValueSmall}>{country.genres.join(", ")}</Text>
          </View>
        </View>

        <Panel style={styles.innerPanel}>
          <Text style={styles.sectionHeading}>Country Snapshot</Text>
          <Text style={styles.placeholderCopy}>{country.sceneNote}</Text>
          <Text style={styles.placeholderCopy}>Top Album: {country.album}</Text>
          <Text style={styles.placeholderCopy}>Lead Artist: {country.albumArtist}</Text>
          <Text style={styles.placeholderCopy}>Most Visible Hidden Track: {country.topSong}</Text>
          <Text style={styles.placeholderCopy}>Primary Languages: {country.languages.join(", ")}</Text>
          <Text style={styles.placeholderCopy}>Featured Artists: {country.featuredArtists.join(", ")}</Text>
        </Panel>

        <View style={styles.buttonRow}>
          <ActionButton label="Open Hidden Gems" onPress={() => onNavigate("hiddenGems")} />
          <ActionButton label="Compare Countries" onPress={() => onNavigate("comparisonSelect")} />
          <ActionButton label="Back to Discovery" onPress={() => onNavigate("discovery")} />
        </View>
      </Panel>
    </ScreenScaffold>
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
