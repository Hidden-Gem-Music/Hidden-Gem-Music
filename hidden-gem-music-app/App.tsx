import { CommonActions, NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { Component, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, Platform } from "react-native";

import { AppHeader } from "./src/components/AppHeader";
import { LoadingOverlay } from "./src/components/LoadingOverlay";
import { ComparisonResultsScreen } from "./src/screens/ComparisonResultsScreen";
import { ComparisonSelectScreen } from "./src/screens/ComparisonSelectScreen";
import { CountryScreen } from "./src/screens/CountryScreen";
import { CreditsScreen } from "./src/screens/CreditsScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { DiscoveryScreen } from "./src/screens/DiscoveryScreen";
import { HiddenGemsScreen } from "./src/screens/HiddenGemsScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { FiltersScreen } from "./src/screens/FiltersScreen.native";

import {
  availableYears,
  getCountriesForYear,
  getCountryByYear,
  getDashboardMetrics,
  getDefaultComparisonIds,
  getFeaturedCountry,
  getSongsForCountryYear,
} from "./src/data/mockData";

import {
  getInitialNavigationSeed,
  getRouteParams,
  linking,
  RootStackParamList,
} from "./src/navigation/linking";

import { ScreenRoute } from "./src/types/navigation";
import { colors } from "./src/theme/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();

type RouteParams = {
  year?: number;
  country?: string;
};

function areRouteParamsEqual(currentParams?: RouteParams, nextParams?: RouteParams) {
  return currentParams?.year === nextParams?.year && currentParams?.country === nextParams?.country;
}

/* ---------------- ERROR BOUNDARY ---------------- */

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("App render error", error);
  }

  private handleReset = () => {
    if (typeof window !== "undefined") {
      window.location.assign("/welcome");
      return;
    }
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorShell}>
          <Text style={styles.errorTitle}>Something on the page crashed.</Text>
          <Pressable onPress={this.handleReset} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Reload To Welcome</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

/* ---------------- APP ---------------- */

export default function App() {
  const [fontsLoaded] = useFonts({
    "NyghtSerif-MediumItalic": require("./src/assets/fonts/nyght-serif-main/fonts/TTF/NyghtSerif-MediumItalic.ttf"),
    "NyghtSerif-Regular": require("./src/assets/fonts/nyght-serif-main/fonts/TTF/NyghtSerif-Regular.ttf"),
  });

  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialNavigationSeed = useRef(getInitialNavigationSeed()).current;
  const initialYear = initialNavigationSeed.year ?? 2021;
  const initialFeaturedCountry = getFeaturedCountry(initialYear);

  const [navigationReady, setNavigationReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>(initialNavigationSeed.route);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedCountryId, setSelectedCountryId] = useState(
    initialNavigationSeed.countryId ?? initialFeaturedCountry.id
  );

  const [selectedSongId, setSelectedSongId] = useState("");
  const [comparisonIds, setComparisonIds] = useState<string[]>(getDefaultComparisonIds());
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const countries = useMemo(() => getCountriesForYear(selectedYear), [selectedYear]);

  const featuredCountry = useMemo(
    () => getFeaturedCountry(selectedYear),
    [selectedYear]
  );

  const songs = useMemo(
    () => getSongsForCountryYear(selectedCountryId, selectedYear),
    [selectedCountryId, selectedYear]
  );

  const selectedCountry = useMemo(
    () => getCountryByYear(selectedCountryId, selectedYear) ?? featuredCountry,
    [selectedCountryId, selectedYear, featuredCountry]
  );

  const selectedSong = useMemo(
    () => songs.find((song) => song.id === selectedSongId) ?? songs[0],
    [selectedSongId, songs]
  );

  const selectedComparisonCountries = useMemo(
    () => countries.filter((country) => comparisonIds.includes(country.id)),
    [comparisonIds, countries]
  );

  const dashboardMetrics = useMemo(
    () => getDashboardMetrics(selectedYear, countries),
    [countries, selectedYear]
  );

  const navigateToRoute = (route: ScreenRoute) => {
    if (!navigationRef.isReady()) return;

    switch (route) {
      case "welcome":
        navigationRef.navigate("welcome");
        break;

      case "discovery":
        navigationRef.navigate("discovery", { year: selectedYear });
        break;

      case "country":
        navigationRef.navigate("country", {
          country: selectedCountryId,
          year: selectedYear,
        });
        break;

      case "hiddenGems":
        navigationRef.navigate("hiddenGems", {
          country: selectedCountryId,
          year: selectedYear,
        });
        break;

      case "comparisonSelect":
        navigationRef.navigate("comparisonSelect", { year: selectedYear });
        break;

      case "comparisonResults":
        navigationRef.navigate("comparisonResults", { year: selectedYear });
        break;

      case "dashboard":
        navigationRef.navigate("dashboard", { year: selectedYear });
        break;

      case "credits":
        navigationRef.navigate("credits");
        break;
        
        case "filters":
  navigationRef.navigate("filters");
  break;  
    }
  };

  const openCountry = (countryId: string) => {
    setSelectedCountryId(countryId);

    if (!navigationRef.isReady()) return;

    navigationRef.navigate("country", {
      country: countryId,
      year: selectedYear,
    });
  };

  const handleYearChange = (nextYear: number, context: string) => {
    if (nextYear === selectedYear) return;

    setLoadingMessage(`Refreshing ${context} for ${nextYear}...`);

    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);

    loadingTimerRef.current = setTimeout(() => {
      setSelectedYear(nextYear);
      setLoadingMessage(null);
    }, 500);
  };

  if (!fontsLoaded) return <View style={styles.appShell} />;

  return (
    <AppErrorBoundary>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => setNavigationReady(true)}
      >
        <View style={styles.appShell}>
          <StatusBar style="light" />

          {!(currentRoute === "welcome" && Platform.OS !== "web") && (
            <AppHeader
              currentRoute={currentRoute}
              onNavigate={navigateToRoute}
              breadcrumbs={[]}
              searchOpen={searchOpen}
              onToggleSearch={() => setSearchOpen((o) => !o)}
              onCloseSearch={() => setSearchOpen(false)}
              countries={countries}
              onOpenCountry={openCountry}
            />
          )}

          <View style={styles.screenArea}>
            <Stack.Navigator
              initialRouteName="welcome"
              screenOptions={{
                headerShown: false,
                animation: "none",
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="welcome">
                {() => (
                  <WelcomeScreen
                    countries={countries}
                    onNavigate={navigateToRoute}
                    onSelectCountry={openCountry}
                    selectedYear={selectedYear}
                    onChangeYear={(y) => handleYearChange(y, "Welcome preview")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="discovery">
                {() => (
                  <DiscoveryScreen
                    countries={countries}
                    selectedCountryId={selectedCountryId}
                    onSelectCountry={setSelectedCountryId}
                    onOpenCountry={openCountry}
                    selectedYear={selectedYear}
                    onChangeYear={(y) => handleYearChange(y, "Discovery")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="filters">
               {() =>
               Platform.OS !== "web" ? (
                <FiltersScreen onNavigate={navigateToRoute} />
               ) : (
                     <View />
                   )
                    }
                  </Stack.Screen>

              <Stack.Screen name="country">
                {() => (
                  <CountryScreen
                    country={selectedCountry}
                    onNavigate={navigateToRoute}
                    selectedYear={selectedYear}
                    onChangeYear={(y) => handleYearChange(y, "Country")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="hiddenGems">
                {() => (
                  <HiddenGemsScreen
                    country={selectedCountry}
                    songs={songs}
                    selectedSongId={selectedSongId}
                    selectedSong={selectedSong}
                    onSelectSong={setSelectedSongId}
                    selectedYear={selectedYear}
                    onChangeYear={(y) => handleYearChange(y, "Hidden Gems")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="comparisonSelect">
                {() => (
                  <ComparisonSelectScreen
                    countries={countries}
                    selectedCountryIds={comparisonIds}
                    onToggleCountry={(id) =>
                      setComparisonIds((c) =>
                        c.includes(id) ? c.filter((x) => x !== id) : [...c, id]
                      )
                    }
                    onDone={() => navigateToRoute("comparisonResults")}
                    selectedYear={selectedYear}
                    onChangeYear={(y) => handleYearChange(y, "Comparison")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="comparisonResults">
                {() => (
                  <ComparisonResultsScreen
                    countries={selectedComparisonCountries}
                    selectedYear={selectedYear}
                    onBack={() => navigateToRoute("comparisonSelect")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="dashboard">
                {() => (
                  <DashboardScreen
                    year={selectedYear}
                    metrics={dashboardMetrics}
                    countries={countries}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="credits" component={CreditsScreen} />
            </Stack.Navigator>
          </View>

          <LoadingOverlay visible={Boolean(loadingMessage)} message={loadingMessage ?? undefined} />
        </View>
      </NavigationContainer>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  appShell: { flex: 1, backgroundColor: colors.background },
  errorShell: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorTitle: { fontSize: 22, textAlign: "center" },
  errorButton: { padding: 12 },
  errorButtonText: { fontSize: 16 },
  screenArea: { flex: 1 },
});