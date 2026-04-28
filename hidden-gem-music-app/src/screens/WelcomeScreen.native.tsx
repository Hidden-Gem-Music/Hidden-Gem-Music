import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
 
import { ActionButton } from "../components/ActionButton";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { ScreenRoute } from "../types/navigation";
import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
 
export type Props = {
  countries: Country[];
  onNavigate: (route: ScreenRoute) => void;
  onSelectCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};
 
export function WelcomeScreen({ countries, onNavigate }: Props) {
  return (
    <ScreenScaffold alwaysScrollableOnWeb>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DiscoveryBlurb
          heading="Hidden Gem Music"
          body="Discover the songs that are loved locally but missed globally. Explore charts by country, compare music scenes, and uncover hidden gems from around the world."
        />
 
        <Panel style={styles.modal}>
          <LinearGradient
            colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.42)", "rgba(66,72,101,0.72)"]}
            locations={[0, 0.42, 0.78, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.modalFill}
          />
          <View style={styles.modalContent}>
            <Text style={styles.brand}>Hidden Gem Music</Text>
            <Text style={styles.summary}>
              Insert somewhat long text about the project and the problem and the solution
            </Text>
            <View style={styles.buttonStack}>
              <ActionButton label="Discovery Globe" size="compact" onPress={() => onNavigate("discovery")} />
              <ActionButton label="Comparison Mode" size="compact" onPress={() => onNavigate("comparisonSelect")} />
              <ActionButton label="Hidden Songs" size="compact" onPress={() => onNavigate("hiddenGems")} />
              <ActionButton label="Dashboard" size="compact" onPress={() => onNavigate("dashboard")} />
              <ActionButton label="Credits" size="compact" onPress={() => onNavigate("credits")} />
            </View>
          </View>
        </Panel>
      </ScrollView>
    </ScreenScaffold>
  );
}
 
const styles = StyleSheet.create({
  scrollContent: {
    gap: 20,
    paddingBottom: 32,
  },
  modal: {
    overflow: "hidden",
    padding: 0,
    backgroundColor: "transparent",
  },
  modalFill: {
    position: "absolute" as const, top: 0, left: 0, bottom: 0, right: 0,
    borderRadius: 22,
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
    gap: 22,
  },
  brand: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 38,
    
    textAlign: "center",
    lineHeight: 44,
  },
  summary: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "center",
  },
  buttonStack: {
    gap: 14,
    alignItems: "center",
    width: "100%",
  },
});