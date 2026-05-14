import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Country } from "../../types/content";
import { colors } from "../../theme/colors";
import { typefaces } from "../../theme/typography";
import { Panel } from "../Panel";
import { GlobeView } from "./GlobeView";

type Props = {
  countries: Country[];
  allCountries?: Country[];
  isLoading?: boolean;
  activeCountryId?: string;
  selectedCountryIds?: string[];
  selectedYear?: number;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
  title: string;
  subtitle?: string;
  rightActionLabel?: string;
  onRightAction?: () => void;
  showHeader?: boolean;
  frameStyle?: StyleProp<ViewStyle>;
  selectOnHover?: boolean;
  genreSummaryByCountryCode?: Record<string, string | undefined>;
  genreLoadingByCountryCode?: Record<string, boolean | undefined>;
  loadingText?: string;
  onEnsureGenreSample?: (countryCode: string) => void;
};

export function GlobePanel({
  countries,
  allCountries,
  isLoading = false,
  activeCountryId,
  selectedCountryIds,
  selectedYear,
  onSelectCountry,
  onOpenCountry,
  title,
  subtitle,
  rightActionLabel = "All Filters",
  onRightAction,
  showHeader = true,
  frameStyle,
  selectOnHover = true,
  genreSummaryByCountryCode,
  genreLoadingByCountryCode,
  loadingText,
  onEnsureGenreSample,
}: Props) {
  const activeCountry = countries.find((country) => country.id === activeCountryId);

  return (
    <View style={styles.wrapper}>
      {showHeader ? (
        <View style={styles.headerRow}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : <View />}
        </View>
      ) : null}

      <Panel style={[styles.frame, frameStyle]}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <GlobeView
            countries={countries}
            allCountries={allCountries}
            activeCountry={activeCountry}
            selectedCountryIds={selectedCountryIds}
            selectedYear={selectedYear}
            onSelectCountry={onSelectCountry}
            onOpenCountry={onOpenCountry}
            onFiltersPress={onRightAction}
            selectOnHover={selectOnHover}
            genreSummaryByCountryCode={genreSummaryByCountryCode}
            genreLoadingByCountryCode={genreLoadingByCountryCode}
            loadingText={loadingText}
            onEnsureGenreSample={onEnsureGenreSample}
          />
        )}
      </Panel>
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
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 24,
    fontWeight: "800",
    transform: [{ translateY: 14 }],
  },
  subtitle: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "right",
    maxWidth: 320,
    marginRight: 18,
    transform: [{ translateY: 14 }],
  },
  frame: {
    minHeight: 520,
    overflow: "hidden",
    padding: 0,
    backgroundColor: colors.background,
  },
  loadingState: {
    flex: 1,
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
  },
});
