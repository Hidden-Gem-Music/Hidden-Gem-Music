import { StyleSheet, Text, View } from "react-native";
import { Country } from "../../types/content";
import { colors } from "../../theme/colors";
import { typefaces } from "../../theme/typography";
import { Panel } from "../Panel";
import { GlobeView } from "./GlobeView";

type Props = {
  countries: Country[];
  activeCountryId: string;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
  title: string;
  subtitle?: string;
  rightActionLabel?: string;
  onRightAction?: () => void;
};

export function GlobePanel({
  countries,
  activeCountryId,
  onSelectCountry,
  onOpenCountry,
  title,
  subtitle,
  rightActionLabel = "All Filters",
  onRightAction,
}: Props) {
  const activeCountry = countries.find((country) => country.id === activeCountryId) ?? countries[0];

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        {title ? <Text style={styles.title}>{title}</Text> : <View />}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : <View />}
      </View>

      <Panel style={styles.frame}>
        <GlobeView
          countries={countries}
          activeCountry={activeCountry}
          onSelectCountry={onSelectCountry}
          onOpenCountry={onOpenCountry}
        />
      </Panel>
      {onRightAction ? (
        <Text style={styles.actionLink} onPress={onRightAction}>
          {rightActionLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    minHeight: 58,
    gap: 14,
    flexWrap: "wrap",
  },
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 24,
    fontWeight: "800",
    transform: [{ translateY: 14 }],
  },
  subtitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "right",
    maxWidth: 320,
    marginRight: 18,
    transform: [{ translateY: 14 }],
  },
  frame: {
    minHeight: 540,
    overflow: "hidden",
    padding: 0,
    backgroundColor: colors.surfaceSecondary,
  },
  actionLink: {
    color: colors.accentSoft,
    fontFamily: typefaces.body,
    fontSize: 16,
    textAlign: "right",
  },
});
