import { CommonActions, NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { Component, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
import {
  availableYears,
  getCountriesForYear,
  getCountryByYear,
  getDashboardMetrics,
  getDefaultComparisonIds,
  getFeaturedCountry,
  getSongsForCountryYear,
} from "./src/data/mockData";
import { getInitialNavigationSeed, getRouteParams, linking, RootStackParamList } from "./src/navigation/linking";
import { ScreenRoute } from "./src/types/navigation";
import { colors } from "./src/theme/colors";
import { typefaces } from "./src/theme/typography";

const Stack = createNativeStackNavigator<RootStackParamList>();

type RouteParams = {
  year?: number;
  country?: string;
};

function areRouteParamsEqual(currentParams?: RouteParams, nextParams?: RouteParams) {
  return currentParams?.year === nextParams?.year && currentParams?.country === nextParams?.country;
}

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

export default function App() {
  const [fontsLoaded] = useFonts({
    "NyghtSerif-MediumItalic": require("./src/assets/fonts/nyght-serif-main/fonts/TTF/NyghtSerif-MediumItalic.ttf"),
    "NyghtSerif-Regular": require("./src/assets/fonts/nyght-serif-main/fonts/TTF/NyghtSerif-Regular.ttf"),
    "NyghtSerif-RegularItalic": require("./src/assets/fonts/nyght-serif-main/fonts/TTF/NyghtSerif-RegularItalic.ttf"),
    "NyghtSerif-Bold": require("./src/assets/fonts/nyght-serif-main/fonts/TTF/NyghtSerif-Bold.ttf"),
    "NyghtSerif-BoldItalic": require("./src/assets/fonts/nyght-serif-main/fonts/TTF/NyghtSerif-BoldItalic.ttf"),
    "NyghtSerif-Dark": require("./src/assets/fonts/nyght-serif-main/fonts/TTF/NyghtSerif-Dark.ttf"),
    "NyghtSerif-DarkItalic": require("./src/assets/fonts/nyght-serif-main/fonts/TTF/NyghtSerif-DarkItalic.ttf"),
    "Tanklager-Kompakt": require("./src/assets/fonts/tanklager/fonts/TTF/Tanklager-Kompakt.ttf"),
    "Tanklager-Original": require("./src/assets/fonts/tanklager/fonts/TTF/Tanklager-Original.ttf"),
  });

  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialNavigationSeedRef = useRef(getInitialNavigationSeed());
  const initialNavigationSeed = initialNavigationSeedRef.current;
  const initialYear = initialNavigationSeed.year ?? 2021;
  const initialFeaturedCountry = getFeaturedCountry(initialYear);

  const [navigationReady, setNavigationReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>(initialNavigationSeed.route);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedCountryId, setSelectedCountryId] = useState(initialNavigationSeed.countryId ?? initialFeaturedCountry.id);
  const [selectedSongId, setSelectedSongId] = useState("");
  const [comparisonIds, setComparisonIds] = useState<string[]>(getDefaultComparisonIds());
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const countries = useMemo(() => getCountriesForYear(selectedYear), [selectedYear]);
  const featuredCountry = useMemo(() => getFeaturedCountry(selectedYear), [selectedYear]);
  const songs = useMemo(() => getSongsForCountryYear(selectedCountryId, selectedYear), [selectedCountryId, selectedYear]);

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

  const dashboardMetrics = useMemo(() => getDashboardMetrics(selectedYear, countries), [countries, selectedYear]);
  const breadcrumbs = useMemo(() => {
    switch (currentRoute) {
      case "welcome":
        return [{ label: "Home", route: "welcome" as ScreenRoute }];
      case "discovery":
        return [
          { label: "Home", route: "welcome" as ScreenRoute },
          { label: "Discovery Globe", route: "discovery" as ScreenRoute },
        ];
      case "country":
        return [
          { label: "Home", route: "welcome" as ScreenRoute },
          { label: "Discovery Globe", route: "discovery" as ScreenRoute },
          { label: selectedCountry.name, route: null },
        ];
      case "hiddenGems":
        return [
          { label: "Home", route: "welcome" as ScreenRoute },
          { label: selectedCountry.name, route: "country" as ScreenRoute },
          { label: "Hidden Gems", route: null },
        ];
      case "comparisonSelect":
        return [
          { label: "Home", route: "welcome" as ScreenRoute },
          { label: "Comparison Mode", route: "comparisonSelect" as ScreenRoute },
        ];
      case "comparisonResults":
        return [
          { label: "Home", route: "welcome" as ScreenRoute },
          { label: "Comparison Mode", route: "comparisonSelect" as ScreenRoute },
          { label: "Results", route: null },
        ];
      case "dashboard":
        return [
          { label: "Home", route: "welcome" as ScreenRoute },
          { label: "Dashboard", route: "dashboard" as ScreenRoute },
        ];
      case "credits":
        return [
          { label: "Home", route: "welcome" as ScreenRoute },
          { label: "Credits", route: "credits" as ScreenRoute },
        ];
      default:
        return [{ label: "Home", route: "welcome" as ScreenRoute }];
    }
  }, [currentRoute, selectedCountry.name]);

  const syncStateFromNavigation = () => {
    if (!navigationRef.isReady()) {
      return;
    }

    const activeRoute = navigationRef.getCurrentRoute();
    if (!activeRoute) {
      return;
    }

    const nextRoute = activeRoute.name as ScreenRoute;
    const params = (activeRoute.params ?? {}) as RouteParams;

    setCurrentRoute(nextRoute);

    if (typeof params.year === "number" && availableYears.includes(params.year)) {
      setSelectedYear((current) => (current === params.year ? current : params.year!));
    }

    if (typeof params.country === "string") {
      setSelectedCountryId((current) => (current === params.country ? current : params.country!));
    }
  };

  const navigateToRoute = (route: ScreenRoute) => {
    if (!navigationRef.isReady()) {
      return;
    }

    switch (route) {
      case "welcome":
        navigationRef.navigate("welcome");
        break;
      case "discovery":
        navigationRef.navigate("discovery", getRouteParams("discovery", selectedYear, selectedCountryId));
        break;
      case "country":
        navigationRef.navigate("country", getRouteParams("country", selectedYear, selectedCountryId));
        break;
      case "hiddenGems":
        navigationRef.navigate("hiddenGems", getRouteParams("hiddenGems", selectedYear, selectedCountryId));
        break;
      case "comparisonSelect":
        navigationRef.navigate("comparisonSelect", getRouteParams("comparisonSelect", selectedYear, selectedCountryId));
        break;
      case "comparisonResults":
        navigationRef.navigate("comparisonResults", getRouteParams("comparisonResults", selectedYear, selectedCountryId));
        break;
      case "dashboard":
        navigationRef.navigate("dashboard", getRouteParams("dashboard", selectedYear, selectedCountryId));
        break;
      case "credits":
        navigationRef.navigate("credits");
        break;
      default:
        navigationRef.navigate("welcome");
        break;
    }
  };

  const openCountry = (countryId: string) => {
    setSelectedCountryId(countryId);

    if (!navigationRef.isReady()) {
      return;
    }

    navigationRef.navigate("country", {
      country: countryId,
      year: selectedYear,
    });
  };

  useEffect(() => {
    if (!songs.find((song) => song.id === selectedSongId)) {
      setSelectedSongId(songs[0]?.id ?? "");
    }
  }, [songs, selectedSongId]);

  useEffect(() => {
    if (!countries.some((country) => country.id === selectedCountryId)) {
      setSelectedCountryId(featuredCountry.id);
    }
  }, [countries, featuredCountry.id, selectedCountryId]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!navigationReady || !navigationRef.isReady()) {
      return;
    }

    const activeRoute = navigationRef.getCurrentRoute();
    if (!activeRoute) {
      return;
    }

    const routeName = activeRoute.name as ScreenRoute;
    const nextParams = getRouteParams(routeName, selectedYear, selectedCountryId);
    const currentParams = (activeRoute.params ?? undefined) as RouteParams | undefined;

    if (nextParams && !areRouteParamsEqual(currentParams, nextParams)) {
      navigationRef.dispatch(CommonActions.setParams(nextParams));
    }
  }, [currentRoute, navigationReady, navigationRef, selectedCountryId, selectedYear]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const styleTag = document.createElement("style");
    styleTag.setAttribute("data-hidden-gem-scrollbars", "true");
    styleTag.textContent = `
      * {
        scrollbar-color: ${colors.scrollbarThumb} ${colors.scrollbarTrack};
      }

      *::-webkit-scrollbar {
        width: 14px;
        height: 14px;
      }

      *::-webkit-scrollbar-track {
        background: ${colors.scrollbarTrack};
        border-radius: 999px;
      }

      *::-webkit-scrollbar-thumb {
        background: ${colors.scrollbarThumb};
        border-radius: 999px;
        border: 2px solid ${colors.scrollbarTrack};
      }

      #list-view-scroll {
        scrollbar-width: none;
      }

      #list-view-scroll::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }

      #screen-scaffold-scroll {
        scrollbar-width: none;
      }

      #screen-scaffold-scroll::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
    `;

    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  const handleYearChange = (nextYear: number, context: string) => {
    if (nextYear === selectedYear) {
      return;
    }

    setLoadingMessage(`Refreshing ${context} for ${nextYear}...`);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    loadingTimerRef.current = setTimeout(() => {
      setSelectedYear(nextYear);
      setLoadingMessage(null);
    }, 500);
  };

  if (!fontsLoaded) {
    return <View style={styles.appShell} />;
  }

  return (
    <AppErrorBoundary>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => {
          setNavigationReady(true);
          syncStateFromNavigation();
        }}
        onStateChange={syncStateFromNavigation}
      >
        <View style={styles.appShell}>
          <StatusBar style="light" />
          <AppHeader
            currentRoute={currentRoute}
            onNavigate={navigateToRoute}
            breadcrumbs={breadcrumbs}
            searchOpen={searchOpen}
            onToggleSearch={() => setSearchOpen((open) => !open)}
            onCloseSearch={() => setSearchOpen(false)}
            countries={countries}
            onOpenCountry={openCountry}
          />
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
                    onChangeYear={(year) => handleYearChange(year, "Welcome preview")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="discovery">
                {() => (
                  <DiscoveryScreen
                    countries={countries}
                    selectedCountryId={selectedCountryId}
                    onSelectCountry={(countryId) => setSelectedCountryId(countryId)}
                    onOpenCountry={openCountry}
                    selectedYear={selectedYear}
                    onChangeYear={(year) => handleYearChange(year, "Discovery Globe")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="country">
                {() => (
                  <CountryScreen
                    country={selectedCountry}
                    onNavigate={navigateToRoute}
                    selectedYear={selectedYear}
                    onChangeYear={(year) => handleYearChange(year, `${selectedCountry.name} overview`)}
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
                    onChangeYear={(year) => handleYearChange(year, `${selectedCountry.name} hidden gems`)}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="comparisonSelect">
                {() => (
                  <ComparisonSelectScreen
                    countries={countries}
                    selectedCountryIds={comparisonIds}
                    onToggleCountry={(countryId) => {
                      setComparisonIds((current) => {
                        if (current.includes(countryId)) {
                          return current.filter((id) => id !== countryId);
                        }
                        if (current.length >= 3) {
                          return current;
                        }
                        return [...current, countryId];
                      });
                    }}
                    onDone={() => navigateToRoute("comparisonResults")}
                    selectedYear={selectedYear}
                    onChangeYear={(year) => handleYearChange(year, "Comparison Mode")}
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
                {() => <DashboardScreen year={selectedYear} metrics={dashboardMetrics} countries={countries} />}
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
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colors.background,
    padding: 24,
  },
  errorTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
    textAlign: "center",
  },
  errorButton: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 18,
  },
  screenArea: {
    flex: 1,
  },
});
