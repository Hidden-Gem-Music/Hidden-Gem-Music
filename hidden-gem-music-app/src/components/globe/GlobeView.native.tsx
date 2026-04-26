import { Pressable, StyleSheet, Text, View } from "react-native";

import { Country } from "../../types/content";
import { colors } from "../../theme/colors";
import { typefaces } from "../../theme/typography";

type Props = {
  countries: Country[];
  activeCountry?: Country;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
};

export function GlobeView({ countries, activeCountry, onSelectCountry, onOpenCountry }: Props) {
  const currentCountry = activeCountry ?? countries[0];

  return (
    <View style={styles.wrapper}>
      <View style={styles.deviceFrame}>
        <Text style={styles.heading}>Mobile Globe Staging</Text>
        <Text style={styles.copy}>
          The final native Mapbox globe will slot in here after the token and native map package are wired.
        </Text>
        <View style={styles.markerList}>
          {countries.map((country) => (
            <Pressable
              key={country.id}
              onPress={() => onSelectCountry(country.id)}
              style={[styles.markerChip, currentCountry?.id === country.id ? styles.markerChipActive : null]}
            >
              <Text style={styles.markerChipText}>{country.name}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.tooltip}
          onPress={() => {
            if (!currentCountry) {
              return;
            }

            if (onOpenCountry) {
              onOpenCountry(currentCountry.id);
              return;
            }

            onSelectCountry(currentCountry.id);
          }}
        >
          <View style={styles.tooltipInner}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipCountry}>{currentCountry.name}</Text>
              <Text style={styles.tooltipRegion}>{currentCountry.region}</Text>
            </View>
            <View style={styles.tooltipDivider} />
            <View style={styles.tooltipBody}>
              <Text style={styles.tooltipCopy}>Hidden Songs: {currentCountry.hiddenSongs}</Text>
              <Text style={styles.tooltipCopy}>Genres: {currentCountry.genres.join(", ")}</Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 580,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 20,
  },
  deviceFrame: {
    width: "100%",
    maxWidth: 470,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: 22,
    gap: 18,
  },
  heading: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 30,
    fontWeight: "800",
  },
  copy: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 28,
  },
  markerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  markerChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: colors.border,
  },
  markerChipActive: {
    backgroundColor: colors.accentDark,
  },
  markerChipText: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    fontWeight: "800",
  },
  tooltip: {
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.border,
    overflow: "hidden",
  },
  tooltipInner: {
    paddingVertical: 0,
  },
  tooltipHeader: {
    backgroundColor: colors.globeCardTop,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 4,
  },
  tooltipDivider: {
    height: 3,
    width: "100%",
    backgroundColor: colors.border,
  },
  tooltipBody: {
    backgroundColor: colors.globeCardBottom,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 6,
  },
  tooltipCountry: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 24,
    fontWeight: "700",
  },
  tooltipRegion: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    fontWeight: "700",
  },
  tooltipCopy: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
});
