import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Country } from "../types/content";
import { CountryCard } from "../components/CountryCard";
import { GlobePanel } from "../components/globe/GlobePanel";
import { ListViewPanel } from "../components/ListViewPanel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { YearSlider } from "../components/YearSlider";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  countries: Country[];
  selectedCountryIds: string[];
  onToggleCountry: (countryId: string) => void;
  onDone: () => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

export function ComparisonSelectScreen({
  countries,
  selectedCountryIds,
  onToggleCountry,
  onDone,
  selectedYear,
  onChangeYear,
}: Props) {
  const { width } = useWindowDimensions();
  const isStacked = width < 980;

  const listColumn = (
    <View style={[styles.leftColumn, isStacked ? styles.columnStacked : null]}>
      <ListViewPanel subtitle={`Selected: ${selectedCountryIds.length} / 3`}>
        {countries.map((country) => (
          <CountryCard
            key={country.id}
            country={country}
            selected={selectedCountryIds.includes(country.id)}
            onPress={() => onToggleCountry(country.id)}
          />
        ))}
      </ListViewPanel>
    </View>
  );

  const globeColumn = (
    <View style={[styles.rightColumn, isStacked ? styles.columnStacked : null]}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>Comparison Mode</Text>
        <Text style={styles.subtitle}>Select up to 3 countries to compare.</Text>
      </View>
      <GlobePanel
        countries={countries}
        activeCountryId={selectedCountryIds[0] ?? countries[0].id}
        onSelectCountry={onToggleCountry}
        title=""
        rightActionLabel="Done"
        onRightAction={onDone}
      />
      <Text style={styles.doneLink} onPress={onDone}>
        Finish Selection
      </Text>
      <YearSlider year={selectedYear} onChangeYear={onChangeYear} />
    </View>
  );

  return (
    <ScreenScaffold>
      <View style={[styles.layout, isStacked ? styles.layoutStacked : null]}>
        {isStacked ? globeColumn : listColumn}
        {isStacked ? listColumn : globeColumn}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: "row",
    gap: 24,
    flexWrap: "wrap",
  },
  layoutStacked: {
    flexDirection: "column",
  },
  leftColumn: {
    flex: 1,
    minWidth: 340,
    gap: 16,
  },
  rightColumn: {
    flex: 1,
    minWidth: 340,
    gap: 18,
  },
  columnStacked: {
    width: "100%",
    minWidth: 0,
  },
  headerArea: {
    alignItems: "center",
    gap: 10,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    fontWeight: "700",
  },
  doneLink: {
    color: colors.accentSoft,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
});
