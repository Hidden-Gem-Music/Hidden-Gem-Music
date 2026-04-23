import { StyleSheet, Text, View } from "react-native";

import { Country } from "../types/content";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  countries: Country[];
  selectedYear: number;
  onBack: () => void;
};

export function ComparisonResultsScreen({ countries, selectedYear, onBack }: Props) {
  return (
    <ScreenScaffold>
      <Text style={styles.title}>Comparison Results:</Text>
      <Text style={styles.subtitle}>Displaying year: {selectedYear}</Text>
      {countries.length === 0 ? (
        <Panel style={styles.emptyPanel}>
          <Text style={styles.emptyText}>
            No countries selected yet. Return to Comparison Mode and choose up to three countries.
          </Text>
        </Panel>
      ) : (
        <View style={styles.layout}>
          {countries.map((country) => (
            <View key={country.id} style={styles.column}>
              <Text style={styles.countryName}>{country.name}</Text>
              <Panel style={styles.panel}>
                <Text style={styles.line}>Hidden Songs: {country.hiddenSongs}</Text>
                <Text style={styles.line}>Genres: {country.genres.join(", ")}</Text>
                <Text style={styles.line}>Top Album: {country.album}</Text>
                <Text style={styles.line}>Artist: {country.albumArtist}</Text>
                <Text style={styles.line}>Region: {country.region}</Text>
                <Text style={styles.line}>Top Song: {country.topSong}</Text>
                <Text style={styles.line}>Languages: {country.languages.join(", ")}</Text>
                <Text style={styles.line}>Featured Artists: {country.featuredArtists.join(", ")}</Text>
              </Panel>
            </View>
          ))}
        </View>
      )}
      <ActionButton label="Back to Comparison Mode" onPress={onBack} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 18,
    textAlign: "center",
  },
  layout: {
    flexDirection: "row",
    gap: 24,
    flexWrap: "wrap",
  },
  column: {
    flex: 1,
    minWidth: 340,
    gap: 16,
  },
  countryName: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  panel: {
    minHeight: 760,
    gap: 18,
  },
  emptyPanel: {
    minHeight: 260,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 28,
    textAlign: "center",
    maxWidth: 700,
  },
  line: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 28,
  },
});
