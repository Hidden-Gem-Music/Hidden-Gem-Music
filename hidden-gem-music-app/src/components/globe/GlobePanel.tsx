import { ActivityIndicator, Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Country } from "../../types/content";
import { useMobileExperience } from "../../config/discoveryMode";
import { colors } from "../../theme/colors";
import { typefaces } from "../../theme/typography";
import { Panel } from "../Panel";
import { GlobeView } from "./GlobeView";

type Props = {
  countries: Country[];
  allCountries?: Country[];
  isLoading?: boolean;
  hoveredCountryId?: string | null;
  selectedCountryIds?: string[];
  selectedYear?: number;
  availableYears?: number[];
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
  onChangeYear?: (year: number) => void;
  title: string;
  subtitle?: string;
  onRightAction?: () => void;
  showHeader?: boolean;
  frameStyle?: StyleProp<ViewStyle>;
  selectOnHover?: boolean;
  onEnsureGenreSample?: (countryCode: string) => void;
  onEnsureLanguageSample?: (countryCode: string) => void;
  isActive?: boolean;
};

export function GlobePanel({
  countries,
  allCountries,
  isLoading = false,
  hoveredCountryId,
  selectedCountryIds,
  selectedYear,
  availableYears,
  onSelectCountry,
  onOpenCountry,
  onChangeYear,
  title,
  subtitle,
  onRightAction,
  showHeader = true,
  frameStyle,
  selectOnHover = true,
  onEnsureGenreSample,
  onEnsureLanguageSample,
  isActive,
}: Props) {
  const useMobileFrame = useMobileExperience();

  return (
    <View style={styles.wrapper}>
      {showHeader ? (
        <View style={styles.headerRow}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : <View />}
        </View>
      ) : null}

      <Panel style={[styles.frame, useMobileFrame ? styles.frameMobile : null, frameStyle]}>
        {isLoading ? (
          <View style={[styles.loadingState, useMobileFrame ? styles.loadingStateMobile : null]}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <GlobeView
            countries={countries}
            allCountries={allCountries}
            externalHoveredCountryId={hoveredCountryId}
            selectedCountryIds={selectedCountryIds}
            selectedYear={selectedYear}
            availableYears={availableYears}
            onSelectCountry={onSelectCountry}
            onOpenCountry={onOpenCountry}
            onChangeYear={onChangeYear}
            onFiltersPress={onRightAction}
            selectOnHover={selectOnHover}
            onEnsureGenreSample={onEnsureGenreSample}
            onEnsureLanguageSample={onEnsureLanguageSample}
            isActive={isActive}
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
    minHeight: Platform.OS === "web" ? 520 : 0,
    overflow: "hidden",
    padding: 0,
    backgroundColor: colors.background,
  },
  frameMobile: {
    minHeight: 0,
  },
  loadingState: {
    flex: 1,
    minHeight: Platform.OS === "web" ? 520 : 360,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingStateMobile: {
    minHeight: 360,
  },
});
