import { CommonActions, NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { Component, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { loadDiscoveryCountries } from "./src/data/discoveryApi";
import { loadAvailableYears } from "./src/data/countryApi";
import {
  availableYears,
  getCountriesForYear,
  getCountryByYear,
  getFeaturedCountry,
} from "./src/data/mockData";
import { getInitialNavigationSeed, getRouteParams, linking, RootStackParamList } from "./src/navigation/linking";
import { Country } from "./src/types/content";
import { ScreenRoute } from "./src/types/navigation";
import { colors } from "./src/theme/colors";
import { typefaces } from "./src/theme/typography";

const Stack = createNativeStackNavigator<RootStackParamList>();

type RouteParams = {
  year?: number;
  country?: string;
};

type PersistedAppState = {
  selectedYear?: number;
  selectedCountryId?: string;
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
      comparisonIds: persistedComparisonIds,
    };
  } catch {
    return {};
  }
}

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
  const hasAppliedLatestYearDefaultRef = useRef(false);
  const suppressOpenUntilRef = useRef(0);
  const isAwaitingDiscoveryRefreshRef = useRef(false);
  const hasSeenDiscoveryLoadingRef = useRef(false);
  const initialNavigationSeedRef = useRef(getInitialNavigationSeed());
  const persistedAppStateRef = useRef(readPersistedAppState());
  const initialNavigationSeed = initialNavigationSeedRef.current;
  const persistedAppState = persistedAppStateRef.current;
  const initialYear = initialNavigationSeed.year ?? persistedAppState.selectedYear ?? 2021;
  const initialFeaturedCountry = getFeaturedCountry(initialYear);

  const [navigationReady, setNavigationReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>(initialNavigationSeed.route);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedCountryId, setSelectedCountryId] = useState(
    initialNavigationSeed.countryId ?? persistedAppState.selectedCountryId ?? initialFeaturedCountry.id
  );
  const [comparisonIds, setComparisonIds] = useState<string[]>(
    initialNavigationSeed.route === "comparisonResults" ? persistedAppState.comparisonIds ?? [] : []
  );
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [showHiddenGemsNavIntro, setShowHiddenGemsNavIntro] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [apiAvailableYears, setApiAvailableYears] = useState<number[]>([]);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(true);
  const [discoveryLoadingDots, setDiscoveryLoadingDots] = useState(1);
  const [discoveryCountriesByYear, setDiscoveryCountriesByYear] = useState<Record<number, Country[]>>({});

  const countries = useMemo(() => getCountriesForYear(selectedYear), [selectedYear]);
  const [discoveryCountries, setDiscoveryCountries] = useState<Country[]>([]);
  const allYearsDiscoveryCountries = useMemo(() => {
    if (apiAvailableYears.length === 0) {
      return discoveryCountries;
    }

    const byId = new Map<string, Country>();
    for (const year of apiAvailableYears) {
      const yearCountries = discoveryCountriesByYear[year] ?? [];
      for (const country of yearCountries) {
        const existing = byId.get(country.id);
        if (!existing || country.hiddenSongs > existing.hiddenSongs) {
          byId.set(country.id, country);
        }
      }
    }

    const merged = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
    return merged.length > 0 ? merged : discoveryCountries;
  }, [apiAvailableYears, discoveryCountries, discoveryCountriesByYear]);
  const featuredCountry = useMemo(() => getFeaturedCountry(selectedYear), [selectedYear]);

  const selectedCountry = useMemo(
    () =>
      discoveryCountries.find((country) => country.id === selectedCountryId || country.code === selectedCountryId) ??
      getCountryByYear(selectedCountryId, selectedYear) ??
      featuredCountry,
    [discoveryCountries, selectedCountryId, selectedYear, featuredCountry]
  );

  const selectedComparisonCountries = useMemo(
    () =>
      comparisonIds
        .map((countryId) => discoveryCountries.find((country) => country.id === countryId))
        .filter((country): country is Country => Boolean(country)),
    [comparisonIds, discoveryCountries]
  );

  const breadcrumbs = useMemo(() => {
    switch (currentRoute) {
      case "welcome":
        return [{ label: "Welcome", route: "welcome" as ScreenRoute }];
      case "discovery":
        return [
          { label: "Welcome", route: "welcome" as ScreenRoute },
          { label: "Discovery Globe", route: "discovery" as ScreenRoute },
        ];
      case "country":
        return [
          { label: "Welcome", route: "welcome" as ScreenRoute },
          { label: "Discovery Globe", route: "discovery" as ScreenRoute },
          { label: selectedCountry.name, route: null },
        ];
      case "hiddenGems":
        return [
          { label: "Welcome", route: "welcome" as ScreenRoute },
          { label: selectedCountry.name, route: "country" as ScreenRoute },
          { label: `${selectedCountry.name}'s Hidden Gems`, route: null },
        ];
      case "comparisonSelect":
        return [
          { label: "Welcome", route: "welcome" as ScreenRoute },
          { label: "Comparison Mode", route: "comparisonSelect" as ScreenRoute },
        ];
      case "comparisonResults":
        return [
          { label: "Welcome", route: "welcome" as ScreenRoute },
          { label: "Comparison Mode", route: "comparisonSelect" as ScreenRoute },
          { label: "Comparison View", route: null },
        ];
      case "dashboard":
        return [
          { label: "Welcome", route: "welcome" as ScreenRoute },
          { label: "Dashboard", route: "dashboard" as ScreenRoute },
        ];
      case "credits":
        return [
          { label: "Welcome", route: "welcome" as ScreenRoute },
          { label: "Credits", route: "credits" as ScreenRoute },
        ];
      default:
        return [{ label: "Welcome", route: "welcome" as ScreenRoute }];
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
        setShowHiddenGemsNavIntro(currentRoute !== "country");
        navigationRef.navigate("hiddenGems", getRouteParams("hiddenGems", selectedYear, selectedCountryId));
        break;
      case "comparisonSelect":
        if (currentRoute !== "comparisonResults") {
          setComparisonIds([]);
        }
        navigationRef.navigate("comparisonSelect", getRouteParams("comparisonSelect", selectedYear, selectedCountryId));
        break;
      case "comparisonResults":
        navigationRef.navigate("comparisonResults", getRouteParams("comparisonResults", selectedYear, selectedCountryId));
        break;
      case "dashboard":
        navigationRef.navigate("dashboard");
        break;
      case "credits":
        navigationRef.navigate("credits");
        break;
      default:
        navigationRef.navigate("welcome");
        break;
    }
  };

  const openHiddenGems = () => {
    if (!navigationRef.isReady()) {
      return;
    }

    setShowHiddenGemsNavIntro(false);
    navigationRef.navigate("hiddenGems", getRouteParams("hiddenGems", selectedYear, selectedCountryId));
  };

  const openCountry = (countryId: string) => {
    if (Date.now() < suppressOpenUntilRef.current) {
      setSelectedCountryId(countryId);
      return;
    }

    const countryLabel = discoveryCountries.find((country) => country.id === countryId)?.name ?? countries.find((country) => country.id === countryId)?.name ?? countryId;

    if (countryId === selectedCountryId) {
      if (navigationRef.isReady()) {
        navigationRef.navigate("country", {
          country: countryId,
          year: selectedYear,
        });
      }
      return;
    }

    setLoadingMessage(`Loading ${countryLabel} for ${selectedYear}...`);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    loadingTimerRef.current = setTimeout(() => {
      setSelectedCountryId(countryId);
      setLoadingMessage(null);

      if (!navigationRef.isReady()) {
        return;
      }

      navigationRef.navigate("country", {
        country: countryId,
        year: selectedYear,
      });
    }, 500);

    return;
  };

  const openCountryFromDiscovery = (countryId: string) => {
    const existsInCurrentYear = countries.some(
      (country) => country.id === countryId || country.code === countryId
    );
    const existsInDiscovery = discoveryCountries.some(
      (country) => country.id === countryId || country.code === countryId
    );

    if (existsInCurrentYear || existsInDiscovery) {
      openCountry(countryId);
      return;
    }

    setSelectedCountryId(countryId);
  };

  const openHiddenGemsForCountry = (countryId: string) => {
    if (Date.now() < suppressOpenUntilRef.current) {
      setSelectedCountryId(countryId);
      return;
    }

    setSelectedCountryId(countryId);
    setShowHiddenGemsNavIntro(false);

    if (!navigationRef.isReady()) {
      return;
    }

    navigationRef.navigate("hiddenGems", {
      country: countryId,
      year: selectedYear,
    });
  };

  useEffect(() => {
    if (currentRoute === "discovery") {
      return;
    }

    const existsInStatic = countries.some((country) => country.id === selectedCountryId || country.code === selectedCountryId);
    const existsInDiscovery = discoveryCountries.some(
      (country) => country.id === selectedCountryId || country.code === selectedCountryId
    );

    if (!existsInStatic && !existsInDiscovery) {
      setSelectedCountryId(featuredCountry.id);
    }
  }, [countries, currentRoute, discoveryCountries, featuredCountry.id, selectedCountryId]);

  useEffect(() => {
    setComparisonIds((current) => current.filter((id) => discoveryCountries.some((country) => country.id === id)).slice(0, 2));
  }, [discoveryCountries]);

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
    let isCancelled = false;
    setIsDiscoveryLoading(true);

    loadDiscoveryCountries(selectedYear, countries)
      .then((apiCountries) => {
        if (isCancelled) {
          return;
        }

        setDiscoveryCountries(apiCountries);
        setDiscoveryCountriesByYear((current) => ({
          ...current,
          [selectedYear]: apiCountries,
        }));
        setIsDiscoveryLoading(false);
      })
      .catch((error) => {
        if (!isCancelled) {
          console.warn("Failed to load discovery countries from API.", error);
          setDiscoveryCountries([]);
          setIsDiscoveryLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [countries, selectedYear]);

  useEffect(() => {
    if (!isDiscoveryLoading) {
      setDiscoveryLoadingDots(1);
      return;
    }

    const timer = setInterval(() => {
      setDiscoveryLoadingDots((current) => (current >= 3 ? 1 : current + 1));
    }, 350);

    return () => clearInterval(timer);
  }, [isDiscoveryLoading]);

  useEffect(() => {
    if (!isAwaitingDiscoveryRefreshRef.current) {
      return;
    }

    if (isDiscoveryLoading) {
      hasSeenDiscoveryLoadingRef.current = true;
      return;
    }

    if (hasSeenDiscoveryLoadingRef.current && loadingMessage && loadingMessage.startsWith("Refreshing")) {
      const timer = setTimeout(() => {
        setLoadingMessage(null);
        isAwaitingDiscoveryRefreshRef.current = false;
        hasSeenDiscoveryLoadingRef.current = false;
      }, 120);

      return () => clearTimeout(timer);
    }
  }, [isDiscoveryLoading, loadingMessage]);

  useEffect(() => {
    let isCancelled = false;

    loadAvailableYears()
      .then((years) => {
        if (!isCancelled && years.length > 0) {
          setApiAvailableYears(years);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.warn("Failed to load API available years; Discovery timeline will use default years.", error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (apiAvailableYears.length === 0 || apiAvailableYears.includes(selectedYear)) {
      return;
    }

    const nearestYear = apiAvailableYears.reduce((currentNearest, currentYear) =>
      Math.abs(currentYear - selectedYear) < Math.abs(currentNearest - selectedYear) ? currentYear : currentNearest
    , apiAvailableYears[0]);

    setSelectedYear(nearestYear);
  }, [apiAvailableYears, selectedYear]);

  useEffect(() => {
    if (hasAppliedLatestYearDefaultRef.current || initialNavigationSeed.year != null || apiAvailableYears.length === 0) {
      return;
    }

    const latestYear = apiAvailableYears[apiAvailableYears.length - 1];
    hasAppliedLatestYearDefaultRef.current = true;
    if (latestYear !== selectedYear) {
      setSelectedYear(latestYear);
    }
  }, [apiAvailableYears, initialNavigationSeed.year, selectedYear]);

  useEffect(() => {
    if (currentRoute !== "hiddenGems") {
      setShowHiddenGemsNavIntro(false);
    }
  }, [currentRoute]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const styleTag = document.createElement("style");
    styleTag.setAttribute("data-hidden-gem-scrollbars", "true");
    styleTag.textContent = `
      html, body, #root {
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: ${colors.background};
      }

      body > div,
      #root > div,
      [data-expo-root] {
        height: 100%;
      }

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

      #comparison-mode-scroll {
        scrollbar-width: none;
      }

      #comparison-mode-scroll::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }

      #discovery-page-scroll {
        scrollbar-width: none;
      }

      #discovery-page-scroll::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
    `;

    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    switch (currentRoute) {
      case "welcome":
        document.title = "Welcome to Hidden Gems Music App";
        break;
      case "discovery":
        document.title = "Discovery Globe";
        break;
      case "country":
        document.title = `${selectedCountry.name}'s Detail Page`;
        break;
      case "hiddenGems":
        document.title = `${selectedCountry.name}'s Hidden Gems`;
        break;
      case "comparisonSelect":
        document.title = "Comparison Mode";
        break;
      case "comparisonResults":
        document.title = "Comparison View";
        break;
      case "credits":
        document.title = "Credits";
        break;
      case "dashboard":
        document.title = "Dashboard";
        break;
      default:
        document.title = "Hidden Gems Music App";
        break;
    }
  }, [currentRoute, selectedCountry.name]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        APP_STATE_STORAGE_KEY,
        JSON.stringify({
          selectedYear,
          selectedCountryId,
          comparisonIds: comparisonIds.slice(0, 2),
        } satisfies PersistedAppState)
      );
    } catch {
      // Ignore localStorage write failures.
    }
  }, [comparisonIds, selectedCountryId, selectedYear]);

  const handleYearChange = (nextYear: number, context: string) => {
    if (nextYear === selectedYear) {
      return;
    }

    if (currentRoute === "discovery" || currentRoute === "welcome") {
      suppressOpenUntilRef.current = Date.now() + 700;
      isAwaitingDiscoveryRefreshRef.current = true;
      hasSeenDiscoveryLoadingRef.current = false;
      setLoadingMessage(`Refreshing ${context} for ${nextYear}...`);
      setSelectedYear(nextYear);
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

  const handleHiddenGemsLoading = useCallback((loading: boolean) => {
    if (currentRoute !== "hiddenGems") {
      setLoadingMessage(null);
      return;
    }
    setLoadingMessage(loading ? "Loading hidden gems..." : null);
  }, [currentRoute]);

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
            countries={discoveryCountries}
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
                    countries={discoveryCountries}
                    availableYears={apiAvailableYears}
                    onNavigate={navigateToRoute}
                    onSelectCountry={openCountry}
                    selectedYear={selectedYear}
                    onChangeYear={(year) => handleYearChange(year, "Welcome preview")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="discovery" options={{ title: "Discovery Globe" }}>
                {() => (
                  <DiscoveryScreen
                    countries={discoveryCountries}
                    allYearsCountries={allYearsDiscoveryCountries}
                    selectedCountryId={selectedCountryId}
                    onSelectCountry={(countryId) => setSelectedCountryId(countryId)}
                    onOpenCountry={openCountryFromDiscovery}
                    selectedYear={selectedYear}
                    onChangeYear={(year) => handleYearChange(year, "Discovery Globe")}
                    availableYears={apiAvailableYears}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="country" options={{ title: `${selectedCountry.name} Detail Page` }}>
                {() => (
                  <CountryScreen
                    country={selectedCountry}
                    countries={discoveryCountries}
                    onSelectCountry={openCountry}
                    onOpenHiddenGems={openHiddenGems}
                    onOpenComparisonMode={() => navigateToRoute("comparisonSelect")}
                    selectedYear={selectedYear}
                    onChangeYear={(year) => handleYearChange(year, `${selectedCountry.name} overview`)}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="hiddenGems" options={{ title: `${selectedCountry.name}'s Hidden Gems` }}>
                {() => (
                  <HiddenGemsScreen
                    country={selectedCountry}
                    countries={discoveryCountries}
                    availableYears={apiAvailableYears}
                    onSelectCountry={(countryId) => setSelectedCountryId(countryId)}
                    selectedYear={selectedYear}
                    onChangeYear={(year) => handleYearChange(year, `${selectedCountry.name} hidden gems`)}
                    onSetLoading={handleHiddenGemsLoading}
                    showNavIntro={showHiddenGemsNavIntro}
                    onDismissNavIntro={() => setShowHiddenGemsNavIntro(false)}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="comparisonSelect" options={{ title: "Comparison Mode" }}>
                {() => (
                  <ComparisonSelectScreen
                    countries={discoveryCountries}
                    selectedCountryIds={comparisonIds}
                    onToggleCountry={(countryId) => {
                      setComparisonIds((current) => {
                        if (current.includes(countryId)) {
                          return current.filter((id) => id !== countryId);
                        }
                        if (current.length >= 2) {
                          return current;
                        }
                        return [...current, countryId];
                      });
                    }}
                    onClearSelections={() => setComparisonIds([])}
                    onDone={() => navigateToRoute("comparisonResults")}
                    selectedYear={selectedYear}
                    availableYears={apiAvailableYears}
                    onChangeYear={(year) => handleYearChange(year, "Comparison Mode")}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="comparisonResults" options={{ title: "Comparison View" }}>
                {() => (
                  <ComparisonResultsScreen
                    countries={selectedComparisonCountries}
                    availableCountries={discoveryCountries}
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

              <Stack.Screen name="dashboard" options={{ title: "Dashboard" }}>
                {() => <DashboardScreen />}
              </Stack.Screen>

              <Stack.Screen name="credits" component={CreditsScreen} options={{ title: "Credits" }} />
            </Stack.Navigator>
          </View>
          <LoadingOverlay
            visible={Boolean(loadingMessage)}
            message={loadingMessage ?? undefined}
          />
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
