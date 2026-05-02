import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Country } from "../types/content";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { DiscoverySidebarPanels } from "../components/Discoverysidebarpanels.native";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { YearSlider } from "../components/YearSlider";

export type Props = {
  countries: Country[];
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

export function DiscoveryScreen({
  countries,
  selectedCountryId,
  onSelectCountry,
  onOpenCountry,
  selectedYear,
  onChangeYear,
}: Props) {
  const [listAutoScrollSignal, setListAutoScrollSignal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeYear = (year: number) => {
    setIsLoading(true);
    onChangeYear(year);
    // Loading overlay auto-dismisses after a brief moment
    setTimeout(() => setIsLoading(false), 600);
  };

  return (
    <ScreenScaffold>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DiscoveryBlurb />

        <YearSlider year={selectedYear} onChangeYear={handleChangeYear} />

        <DiscoverySidebarPanels
          countries={countries}
          selectedCountryId={selectedCountryId}
          onSelectCountry={(id) => {
            onSelectCountry(id);
            setListAutoScrollSignal((s) => s + 1);
          }}
          onOpenCountry={onOpenCountry}
          autoScrollSignal={listAutoScrollSignal}
        />
      </ScrollView>

      <LoadingOverlay visible={isLoading} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 32,
  },
});