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
// ── ADDED: Search screen ──────────────────────────────────────────────────────
import { SearchScreen } from "./src/screens/SearchScreen";

import {
  availableYears,
  getCountriesForYear,
  getCountryByYear,
  getDashboardMetrics,
  getFeaturedCountry,
  getSongsForCountryYear,
  searchLibrary,  // ← make sure this is exported from mockData
} from "./src/data/mockData";
import { getInitialNavigationSeed, getRouteParams, linking, RootStackParamList } from "./src/navigation/linking";
import { ScreenRoute } from "./src/types/navigation";
import { colors } from "./src/theme/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();

type RouteParams = {
  year?: number;
  country?: string;
};

type PersistedAppState = {
  selectedYear?: number;
  selectedCountryId?: string;
  selectedSongId?: string;
  comparisonIds?: string[];
};

const APP_STATE_STORAGE_KEY = "hidden-gem-app-state-v1";

function readPersistedAppState(): PersistedAppState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as PersistedAppState;
    const persistedYear =
      typeof parsedValue.selectedYear === "number" && availableYears.includes(parsedValue.selectedYear)
        ? parsedValue.selectedYear
        : undefined;
    const persistedComparisonIds = Array.isArray(parsedValue.comparisonIds)
      ? parsedValue.comparisonIds.filter((value): value is string => typeof value === "string").slice(0, 2)
      : undefined;

    return {
      selectedYear: persistedYear,
      selectedCountryId: typeof parsedValue.selectedCountryId === "string" ? parsedValue.selectedCountryId : undefined,
      selectedSongId: typeof parsedValue.selectedSongId === "string" ? parsedValue.selectedSongId : undefined,
      comparisonIds: persistedComparisonIds,
    };
  } catch {
    return {};
  }
}

function areRouteParamsEqual(currentParams?: RouteParams, nextParams?: RouteParams) {
  return currentParams?.year === nextParams?.year && currentParams?.country === nextParams?.country;
}

function getDefaultComparisonIds(): string[] {
  return [];
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

  // ── REMOVED: searchOpen state — search is now a full screen, not an overlay

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
    () =>
      comparisonIds
        .map((countryId) => countries.find((country) => country.id === countryId))
        .filter((country): country is NonNullable<typeof country> => Boolean(country)),
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
      // ── ADDED: breadcrumb for search screen
      case "search":
        return [
          { label: "Home", route: "welcome" as ScreenRoute },
          { label: "Search", route: null },
        ];
      default:
        return [{ label: "Home", route: "welcome" as ScreenRoute }];
    }
  }, [currentRoute, selectedCountry.name]);

  const syncStateFromNavigation = () => {
    if (!navigationRef.isReady()) return;

    const activeRoute = navigationRef.getCurrentRoute();
    if (!activeRoute) return;

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
    if (!navigationRef.isReady()) return;

    switch (route) {
      case "welcome":
        navigationRef.navigate("welcome");
        break;
      case "discovery":
        navigationRef.navigate("discovery", { year: selectedYear });
        break;
      case "country":
        navigationRef.navigate("country", { country: selectedCountryId, year: selectedYear });
        break;
      case "hiddenGems":
        navigationRef.navigate("hiddenGems", { country: selectedCountryId, year: selectedYear });
        break;
      case "comparisonSelect":
        navigationRef.navigate("comparisonSelect", getRouteParams("comparisonSelect", selectedYear, selectedCountryId));
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
      // ── ADDED: navigate to search screen
      case "search":
        navigationRef.navigate("search");
        break;
    }
  };

  const openHiddenGems = (selection?: { songTitle?: string; artist?: string }) => {
    const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";
    const normalizedTitle = normalize(selection?.songTitle);
    const normalizedArtist = normalize(selection?.artist);
    const matchedSong =
      songs.find(
        (song) =>
          normalizedTitle &&
          normalize(song.title) === normalizedTitle &&
          (!normalizedArtist || normalize(song.artist) === normalizedArtist)
      ) ??
      songs.find((song) => normalizedTitle && normalize(song.title) === normalizedTitle) ??
      songs.find((song) => normalizedArtist && normalize(song.artist) === normalizedArtist) ??
      songs[0];

    if (matchedSong) setSelectedSongId(matchedSong.id);
    if (!navigationRef.isReady()) return;
    navigationRef.navigate("hiddenGems", getRouteParams("hiddenGems", selectedYear, selectedCountryId));
  };

  const openHiddenGemsForCountry = (countryId: string) => {
    setSelectedCountryId(countryId);
    if (!navigationRef.isReady()) return;
    navigationRef.navigate("hiddenGems", getRouteParams("hiddenGems", selectedYear, countryId));
  };

  const openCountry = (countryId: string) => {
    setSelectedCountryId(countryId);
    if (!navigationRef.isReady()) return;
    navigationRef.navigate("country", { country: countryId, year: selectedYear });
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
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!navigationReady || !navigationRef.isReady()) return;

    const activeRoute = navigationRef.getCurrentRoute();
    if (!activeRoute) return;

    const routeName = activeRoute.name as ScreenRoute;
    const nextParams = getRouteParams(routeName, selectedYear, selectedCountryId);
    const currentParams = (activeRoute.params ?? undefined) as RouteParams | undefined;

    if (nextParams && !areRouteParamsEqual(currentParams, nextParams)) {
      navigationRef.dispatch(CommonActions.setParams(nextParams));
    }
  }, [currentRoute, navigationReady, navigationRef, selectedCountryId, selectedYear]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const styleTag = document.createElement("style");
    styleTag.setAttribute("data-hidden-gem-scrollbars", "true");
    styleTag.textContent = `
      * { scrollbar-color: ${colors.scrollbarThumb} ${colors.scrollbarTrack}; }
      *::-webkit-scrollbar { width: 14px; height: 14px; }
      *::-webkit-scrollbar-track { background: ${colors.scrollbarTrack}; border-radius: 999px; }
      *::-webkit-scrollbar-thumb { background: ${colors.scrollbarThumb}; border-radius: 999px; border: 2px solid ${colors.scrollbarTrack}; }
      #list-view-scroll { scrollbar-width: none; }
      #list-view-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
      #screen-scaffold-scroll { scrollbar-width: none; }
      #screen-scaffold-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
    `;

    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

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
            searchOpen={false}
            onToggleSearch={() => navigateToRoute("search")}
            onCloseSearch={() => {}}
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
              <Stack.Screen name="welcome" options={{ title: "Welcome" }}>
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

              <Stack.Screen name="discovery" options={{ title: "Discovery Globe" }}>
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

              {/* ── ADDED: Search as a full stack screen ───────────────────── */}
              <Stack.Screen name="search" options={{ title: "Search" }}>
                {() => (
                  <SearchScreen
                    countries={countries}
                    selectedYear={selectedYear}
                    searchLibrary={searchLibrary}
                    onOpenCountry={(countryId) => {
                      openCountry(countryId);
                    }}
                    onOpenSong={(countryId, songId) => {
                      setSelectedCountryId(countryId);
                      setSelectedSongId(songId);
                      navigationRef.navigate("hiddenGems", {
                        country: countryId,
                        year: selectedYear,
                      });
                    }}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="country" options={{ title: `${selectedCountry.name} Detail Page` }}>
                {() => (
                  <CountryScreen
                    country={selectedCountry}
                    countries={countries}
                    onSelectCountry={openCountry}
                    onOpenHiddenGems={openHiddenGems}
                    onOpenComparisonMode={() => navigateToRoute("comparisonSelect")}
                    selectedYear={selectedYear}
                    onChangeYear={(y) => handleYearChange(y, "Country")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="hiddenGems" options={{ title: `${selectedCountry.name}'s Hidden Gems` }}>
                {() => (
                  <HiddenGemsScreen
                    country={selectedCountry}
                    countries={countries}
                    songs={songs}
                    selectedSongId={selectedSongId}
                    selectedSong={selectedSong}
                    onSelectSong={setSelectedSongId}
                    onSelectCountry={(countryId) => setSelectedCountryId(countryId)}
                    selectedYear={selectedYear}
                    onChangeYear={(y) => handleYearChange(y, "Hidden Gems")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="comparisonSelect" options={{ title: "Comparison Mode" }}>
                {() => (
                  <ComparisonSelectScreen
                    countries={countries}
                    selectedCountryIds={comparisonIds}
                    onToggleCountry={(countryId) => {
                      setComparisonIds((current) => {
                        if (current.includes(countryId)) return current.filter((id) => id !== countryId);
                        if (current.length >= 3) return current;
                        return [...current, countryId];
                      });
                    }}
                    onDone={() => navigateToRoute("comparisonResults")}
                    selectedYear={selectedYear}
                    onChangeYear={(y) => handleYearChange(y, "Comparison")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="comparisonResults" options={{ title: "Comparison View" }}>
                {() => (
                  <ComparisonResultsScreen
                    countries={selectedComparisonCountries}
                    availableCountries={countries}
                    selectedYear={selectedYear}
                    onBack={() => navigateToRoute("comparisonSelect")}
                    onChangeYear={(year) => handleYearChange(year, "Comparison View")}
                    onChangeCountryAtIndex={(index, countryId) => {
                      setComparisonIds((current) => {
                        const next = [...current];
                        next[index] = countryId;
                        return next.slice(0, 2);
                      });
                    }}
                    onOpenCountry={openCountry}
                    onOpenHiddenGemsForCountry={openHiddenGemsForCountry}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="dashboard">
                {() => <DashboardScreen year={selectedYear} metrics={dashboardMetrics} countries={countries} />}
              </Stack.Screen>

              <Stack.Screen name="credits" component={CreditsScreen} options={{ title: "Credits" }} />
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