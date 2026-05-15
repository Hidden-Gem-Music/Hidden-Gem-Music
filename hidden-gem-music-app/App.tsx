import { CommonActions, NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { Component, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "./src/components/AppHeader";
import { LoadingOverlay } from "./src/components/LoadingOverlay";
import { MobileBottomNav } from "./src/components/MobileBottomNav";
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
import { isCountryWithAppData } from "./src/data/countryDisplay";
import {
  availableYears,
  getCountriesForYear,
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

const EMPTY_COUNTRIES: Country[] = [];

function isUiVisibleCountry(country: Pick<Country, "code" | "name">) {
  return country.code.trim().toUpperCase() !== "GLOBAL" && country.name.trim().toLowerCase() !== "global";
}

function isSelectableApiCountry(country: Country) {
  return isUiVisibleCountry(country) && isCountryWithAppData(country);
}

type HiddenGemsFocusSelection = {
  countryId?: string;
  requestKey?: string;
  songTitle?: string;
  artist?: string;
  previewIndex?: number;
  deezerTrackId?: number;
};

const APP_STATE_STORAGE_KEY = "hidden-gem-app-state-v1";
const HIDDEN_GEMS_HANDOFF_STORAGE_KEY = "hidden-gems-direct-handoff-v1";
const DEFAULT_DISCOVERY_YEAR = 2025;

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

function readAndClearHiddenGemsHandoffMarker(seed: { route: ScreenRoute; year?: number; countryId?: string }) {
  if (seed.route !== "hiddenGems" || typeof window === "undefined") {
    return false;
  }

  try {
    const rawValue = window.sessionStorage.getItem(HIDDEN_GEMS_HANDOFF_STORAGE_KEY);
    window.sessionStorage.removeItem(HIDDEN_GEMS_HANDOFF_STORAGE_KEY);
    if (!rawValue) {
      return false;
    }

    const parsedValue = JSON.parse(rawValue) as { countryId?: string; year?: number };
    const markerCountry = typeof parsedValue.countryId === "string" ? normalizeCountryKey(parsedValue.countryId) : "";
    const seedCountry = typeof seed.countryId === "string" ? normalizeCountryKey(seed.countryId) : "";
    return Boolean(markerCountry && seedCountry && markerCountry === seedCountry && parsedValue.year === seed.year);
  } catch {
    return false;
  }
}

function writeHiddenGemsHandoffMarker(countryId: string, year: number) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(HIDDEN_GEMS_HANDOFF_STORAGE_KEY, JSON.stringify({ countryId, year }));
  } catch {
    // Ignore sessionStorage failures; the direct handoff still works before refresh.
  }
}

function clearHiddenGemsHandoffMarker() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(HIDDEN_GEMS_HANDOFF_STORAGE_KEY);
  } catch {
    // Ignore sessionStorage failures.
  }
}

function areRouteParamsEqual(currentParams?: RouteParams, nextParams?: RouteParams) {
  return currentParams?.year === nextParams?.year && currentParams?.country === nextParams?.country;
}

function normalizeCountryKey(value: string) {
  return value.trim().toLowerCase();
}

function findCountryByIdentifier(list: Country[], identifier: string) {
  const normalized = normalizeCountryKey(identifier);
  return list.find(
    (country) =>
      normalizeCountryKey(country.id) === normalized || normalizeCountryKey(country.code) === normalized
  );
}

function toInitialStackRoute(route: ScreenRoute): keyof RootStackParamList {
  switch (route) {
    case "welcome":
    case "discovery":
    case "country":
    case "hiddenGems":
    case "comparisonSelect":
    case "comparisonResults":
    case "dashboard":
    case "credits":
      return route;
    default:
      return "welcome";
  }
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
    if (typeof window !== "undefined" && typeof window.location?.assign === "function") {
      try {
        window.localStorage.removeItem(APP_STATE_STORAGE_KEY);
      } catch {
        // Ignore localStorage failures during crash recovery.
      }
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
  const suppressOpenUntilRef = useRef(0);
  const isAwaitingDiscoveryRefreshRef = useRef(false);
  const hasSeenDiscoveryLoadingRef = useRef(false);
  const initialNavigationSeedRef = useRef(getInitialNavigationSeed());
  const persistedAppStateRef = useRef(readPersistedAppState());
  const initialNavigationSeed = initialNavigationSeedRef.current;
  const initialStackRoute = toInitialStackRoute(initialNavigationSeed.route);
  const persistedAppState = persistedAppStateRef.current;
  const shouldResetHiddenGemsHandoffOnInitialLoad = readAndClearHiddenGemsHandoffMarker(initialNavigationSeed);
  const shouldStartHiddenGemsWithIntro =
    initialNavigationSeed.route === "hiddenGems" &&
    (shouldResetHiddenGemsHandoffOnInitialLoad || !initialNavigationSeed.countryId || typeof initialNavigationSeed.year !== "number");
  const initialYear =
    initialNavigationSeed.route === "country" ||
    initialNavigationSeed.route === "hiddenGems" ||
    initialNavigationSeed.route === "comparisonSelect" ||
    initialNavigationSeed.route === "comparisonResults"
      ? initialNavigationSeed.year ?? DEFAULT_DISCOVERY_YEAR
      : DEFAULT_DISCOVERY_YEAR;
  const initialFeaturedCountry = getFeaturedCountry(initialYear);
  const initialSelectedCountryId =
    initialNavigationSeed.route === "country" || initialNavigationSeed.route === "hiddenGems"
      ? initialNavigationSeed.countryId ?? initialFeaturedCountry.id
      : initialFeaturedCountry.id;

  const [navigationReady, setNavigationReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>(initialNavigationSeed.route);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedCountryId, setSelectedCountryId] = useState(initialSelectedCountryId);
  const [comparisonIds, setComparisonIds] = useState<string[]>(
    initialNavigationSeed.route === "comparisonResults" ? persistedAppState.comparisonIds ?? [] : []
  );
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [showHiddenGemsNavIntro, setShowHiddenGemsNavIntro] = useState(shouldStartHiddenGemsWithIntro);
  const [hiddenGemsFocusSelection, setHiddenGemsFocusSelection] = useState<HiddenGemsFocusSelection | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [apiAvailableYears, setApiAvailableYears] = useState<number[]>([]);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(true);
  const [discoveryLoadingDots, setDiscoveryLoadingDots] = useState(1);
  const [discoveryCountriesByYear, setDiscoveryCountriesByYear] = useState<Record<number, Country[]>>({});

  const countries = useMemo(() => getCountriesForYear(selectedYear), [selectedYear]);
  const [discoveryCountries, setDiscoveryCountries] = useState<Country[]>([]);
  const cachedCountriesForSelectedYear = discoveryCountriesByYear[selectedYear] ?? EMPTY_COUNTRIES;
  const shouldHydrateApiCountryPool = currentRoute !== "dashboard" && currentRoute !== "credits";
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

    const merged = Array.from(byId.values())
      .filter(isSelectableApiCountry)
      .sort((a, b) => a.name.localeCompare(b.name));
    return merged.length > 0 ? merged : discoveryCountries.filter(isSelectableApiCountry);
  }, [apiAvailableYears, discoveryCountries, discoveryCountriesByYear]);
  const featuredCountry = useMemo(() => getFeaturedCountry(selectedYear), [selectedYear]);
  const apiCountryPool = useMemo(
    () => (cachedCountriesForSelectedYear.length > 0 ? cachedCountriesForSelectedYear : discoveryCountries).filter(isSelectableApiCountry),
    [cachedCountriesForSelectedYear, discoveryCountries]
  );

  const selectedCountry = useMemo(
    () => {
      const fromDiscovery = findCountryByIdentifier(apiCountryPool, selectedCountryId);
      if (fromDiscovery) {
        return fromDiscovery;
      }

      if (currentRoute === "country" || currentRoute === "hiddenGems") {
        const inferredCode = selectedCountryId && selectedCountryId.length <= 3 ? selectedCountryId.toUpperCase() : featuredCountry.code;
        return {
          ...featuredCountry,
          id: selectedCountryId || featuredCountry.id,
          code: inferredCode,
          name: "Loading country...",
          region: "Loading country data...",
          hiddenSongs: 1,
          genres: [],
          album: "",
          albumArtist: "",
          topSong: "",
          languages: [],
          sceneNote: "Loading country data...",
          featuredArtists: [],
        };
      }

      return featuredCountry;
    },
    [apiCountryPool, currentRoute, featuredCountry, selectedCountryId]
  );

  const comparisonCountryPool = useMemo(
    () => apiCountryPool,
    [apiCountryPool]
  );
  const selectedComparisonCountries = useMemo(
    () =>
      comparisonIds
        .map((countryId) => comparisonCountryPool.find((country) => country.id === countryId || country.code === countryId))
        .filter((country): country is Country => Boolean(country)),
    [comparisonCountryPool, comparisonIds]
  );

  const breadcrumbs = useMemo(() => {
    switch (currentRoute) {
      case "welcome":
        return [{ label: "Welcome", route: "welcome" as ScreenRoute }];
      case "discovery":
        return [
          { label: "Welcome", route: "welcome" as ScreenRoute },
          { label: "Discovery Map", route: "discovery" as ScreenRoute },
        ];
      case "country":
        return [
          { label: "Welcome", route: "welcome" as ScreenRoute },
          { label: "Discovery Map", route: "discovery" as ScreenRoute },
          { label: selectedCountry.name, route: null },
        ];
      case "hiddenGems":
        if (showHiddenGemsNavIntro) {
          return [
            { label: "Welcome", route: "welcome" as ScreenRoute },
            { label: "Hidden Gems", route: null },
          ];
        }
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
  }, [currentRoute, selectedCountry.name, showHiddenGemsNavIntro]);

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

    const canSyncRouteYear =
      nextRoute === "country" ||
      nextRoute === "hiddenGems" ||
      nextRoute === "comparisonSelect" ||
      nextRoute === "comparisonResults";

    if (canSyncRouteYear && typeof params.year === "number" && availableYears.includes(params.year)) {
      setSelectedYear((current) => (current === params.year ? current : params.year!));
    }

    if ((nextRoute === "country" || nextRoute === "hiddenGems") && typeof params.country === "string") {
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
        clearHiddenGemsHandoffMarker();
        setShowHiddenGemsNavIntro(true);
        setHiddenGemsFocusSelection(null);
        navigationRef.navigate("hiddenGems");
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

  const handleWelcomeRouteSelection = (route: ScreenRoute) => {
    if (!navigationRef.isReady()) {
      return;
    }

    if (navigationRef.canGoBack()) {
      navigationRef.goBack();
    } else {
      navigationRef.navigate("discovery", getRouteParams("discovery", selectedYear, selectedCountryId));
    }

    if (route === "discovery") {
      return;
    }

    globalThis.setTimeout(() => {
      navigateToRoute(route);
    }, 40);
  };

  const openHiddenGems = (selection?: HiddenGemsFocusSelection) => {
    if (!navigationRef.isReady()) {
      return;
    }

    setHiddenGemsFocusSelection(
      selection
        ? { ...selection, countryId: selectedCountryId, requestKey: `${Date.now()}-${Math.random()}` }
        : null
    );
    setShowHiddenGemsNavIntro(false);
    writeHiddenGemsHandoffMarker(selectedCountryId, selectedYear);
    navigationRef.navigate("hiddenGems", getRouteParams("hiddenGems", selectedYear, selectedCountryId));
  };

  const openCountry = (countryId: string) => {
    if (Date.now() < suppressOpenUntilRef.current) {
      setSelectedCountryId(countryId);
      return;
    }

    if (countryId === selectedCountryId) {
      if (navigationRef.isReady()) {
        navigationRef.navigate("country", {
          country: countryId,
          year: selectedYear,
        });
      }
      return;
    }

    setSelectedCountryId(countryId);
    setLoadingMessage(null);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    if (!navigationRef.isReady()) {
      return;
    }

    navigationRef.navigate("country", {
      country: countryId,
      year: selectedYear,
    });

    return;
  };

  const openCountryFromDiscovery = (countryId: string) => {
    const existsInDiscovery = apiCountryPool.some(
      (country) => country.id === countryId || country.code === countryId
    );

    if (existsInDiscovery) {
      openCountry(countryId);
      return;
    }

    setSelectedCountryId(countryId);
  };

  const openHiddenGemsForCountry = (countryId: string, selection?: HiddenGemsFocusSelection) => {
    if (Date.now() < suppressOpenUntilRef.current) {
      setSelectedCountryId(countryId);
      return;
    }

    setSelectedCountryId(countryId);
    setHiddenGemsFocusSelection(
      selection ? { ...selection, countryId, requestKey: `${Date.now()}-${Math.random()}` } : null
    );
    setShowHiddenGemsNavIntro(false);
    writeHiddenGemsHandoffMarker(countryId, selectedYear);

    if (!navigationRef.isReady()) {
      return;
    }

    navigationRef.navigate("hiddenGems", {
      country: countryId,
      year: selectedYear,
    });
  };

  useEffect(() => {
    if (currentRoute === "discovery" || currentRoute === "country" || currentRoute === "hiddenGems") {
      return;
    }

    const existsInDiscovery = discoveryCountries.some(
      (country) => country.id === selectedCountryId || country.code === selectedCountryId
    );

    if (!existsInDiscovery) {
      setSelectedCountryId(featuredCountry.id);
    }
  }, [apiCountryPool, currentRoute, discoveryCountries, featuredCountry.id, selectedCountryId]);

  useEffect(() => {
    setComparisonIds((current) => {
      const next = current
        .filter((id) => comparisonCountryPool.some((country) => country.id === id || country.code === id))
        .slice(0, 2);

      if (next.length === current.length && next.every((id, index) => id === current[index])) {
        return current;
      }

      return next;
    });
  }, [comparisonCountryPool]);

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
    const nextParams = routeName === "hiddenGems" && showHiddenGemsNavIntro
      ? { country: undefined, year: undefined }
      : getRouteParams(routeName, selectedYear, selectedCountryId);
    const currentParams = (activeRoute.params ?? undefined) as RouteParams | undefined;

    if (nextParams && !areRouteParamsEqual(currentParams, nextParams)) {
      navigationRef.dispatch(CommonActions.setParams(nextParams));
    }
  }, [currentRoute, navigationReady, navigationRef, selectedCountryId, selectedYear, showHiddenGemsNavIntro]);

  useEffect(() => {
    if (!navigationReady || !navigationRef.isReady()) {
      return;
    }

    const activeRoute = navigationRef.getCurrentRoute();
    const routeCountry = typeof activeRoute?.params === "object" && activeRoute?.params && "country" in activeRoute.params
      ? String((activeRoute.params as { country?: string }).country ?? "").trim()
      : "";

    if (!routeCountry) {
      return;
    }

    if (currentRoute === "country" || currentRoute === "hiddenGems") {
      const normalizedRouteCountry = normalizeCountryKey(routeCountry);
      const normalizedSelectedCountry = normalizeCountryKey(selectedCountryId);
      if (normalizedRouteCountry !== normalizedSelectedCountry) {
        setSelectedCountryId(routeCountry);
      }
    }
  }, [currentRoute, navigationReady, navigationRef, selectedCountryId]);

  useEffect(() => {
    if (!shouldHydrateApiCountryPool) {
      return;
    }

    const cachedCountries = discoveryCountriesByYear[selectedYear];
    if (cachedCountries && cachedCountries.length > 0) {
      setDiscoveryCountries(cachedCountries);
      setIsDiscoveryLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsDiscoveryLoading(discoveryCountries.length === 0);

    loadDiscoveryCountries(selectedYear, countries, controller.signal)
      .then((apiCountries) => {
        if (controller.signal.aborted) {
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
        if (!controller.signal.aborted) {
          console.warn("Failed to load discovery countries from API.", error);
          setDiscoveryCountries([]);
          setIsDiscoveryLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [countries, discoveryCountries.length, discoveryCountriesByYear, selectedYear, shouldHydrateApiCountryPool]);

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

    if (loadingMessage && loadingMessage.startsWith("Refreshing")) {
      const timer = setTimeout(() => {
        setLoadingMessage(null);
        isAwaitingDiscoveryRefreshRef.current = false;
        hasSeenDiscoveryLoadingRef.current = false;
      }, 120);

      return () => clearTimeout(timer);
    }
  }, [isDiscoveryLoading, loadingMessage]);

  useEffect(() => {
    if (currentRoute === "discovery" || !loadingMessage?.startsWith("Refreshing Discovery Map")) {
      return;
    }

    setLoadingMessage(null);
    isAwaitingDiscoveryRefreshRef.current = false;
    hasSeenDiscoveryLoadingRef.current = false;
  }, [currentRoute, loadingMessage]);

  useEffect(() => {
    const controller = new AbortController();

    loadAvailableYears(controller.signal)
      .then((years) => {
        if (!controller.signal.aborted && years.length > 0) {
          setApiAvailableYears(years);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.warn("Failed to load API available years; Discovery timeline will use default years.", error);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (apiAvailableYears.length === 0 || apiAvailableYears.includes(selectedYear)) {
      return;
    }

    if (availableYears.includes(selectedYear)) {
      return;
    }

    const nearestYear = apiAvailableYears.reduce((currentNearest, currentYear) =>
      Math.abs(currentYear - selectedYear) < Math.abs(currentNearest - selectedYear) ? currentYear : currentNearest
    , apiAvailableYears[0]);

    setSelectedYear(nearestYear);
  }, [apiAvailableYears, selectedYear]);

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
        document.title = "Discovery Map";
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
          comparisonIds: comparisonIds.slice(0, 2),
        } satisfies PersistedAppState)
      );
    } catch {
      // Ignore localStorage write failures.
    }
  }, [comparisonIds, currentRoute, selectedCountryId, selectedYear]);

  const handleYearChange = (nextYear: number, context: string) => {
    if (nextYear === selectedYear) {
      return;
    }

    if (currentRoute === "discovery" || currentRoute === "welcome") {
      suppressOpenUntilRef.current = Date.now() + 700;
      isAwaitingDiscoveryRefreshRef.current = true;
      hasSeenDiscoveryLoadingRef.current = false;
      setLoadingMessage(`Refreshing ${context} for ${nextYear}...`);
      setIsDiscoveryLoading(true);
      setSelectedYear(nextYear);
      return;
    }

    if (currentRoute === "hiddenGems") {
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
    if (showHiddenGemsNavIntro) {
      setLoadingMessage(null);
      return;
    }
    setLoadingMessage(loading ? "Loading hidden gems..." : null);
  }, [currentRoute, showHiddenGemsNavIntro]);

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
          if (initialNavigationSeed.route === "welcome") {
            navigationRef.dispatch(
              CommonActions.reset({
                index: 1,
                routes: [
                  {
                    name: "discovery",
                    params: getRouteParams("discovery", selectedYear, selectedCountryId),
                  },
                  { name: "welcome" },
                ],
              })
            );
            return;
          }

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
            countries={comparisonCountryPool}
            onOpenCountry={openCountry}
          />
          <View style={styles.screenArea}>
            <Stack.Navigator
              initialRouteName={initialStackRoute}
              screenOptions={{
                headerShown: false,
                animation: "none",
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen
                name="welcome"
                options={{
                  title: "Welcome",
                  presentation: "transparentModal",
                  animation: "fade",
                  contentStyle: { backgroundColor: "transparent" },
                }}
              >
                {() => (
                  <WelcomeScreen
                    onDismiss={() => {
                      if (navigationRef.canGoBack()) {
                        navigationRef.goBack();
                      } else {
                        navigationRef.navigate("discovery", getRouteParams("discovery", selectedYear, selectedCountryId));
                      }
                    }}
                    onSelectRoute={handleWelcomeRouteSelection}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="discovery" options={{ title: "Discovery Map" }}>
                {() => (
                  <DiscoveryScreen
                    isActive={currentRoute === "discovery"}
                    isLoading={isDiscoveryLoading && discoveryCountries.length === 0}
                    countries={apiCountryPool}
                    allYearsCountries={allYearsDiscoveryCountries}
                    selectedCountryId={selectedCountryId}
                    onSelectCountry={(countryId) => setSelectedCountryId(countryId)}
                    onOpenCountry={openCountryFromDiscovery}
                    selectedYear={selectedYear}
                    onChangeYear={(year) => handleYearChange(year, "Discovery Map")}
                    availableYears={apiAvailableYears}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="country" options={{ title: `${selectedCountry.name} Detail Page` }}>
                {() => (
                  <CountryScreen
                    isActive={currentRoute === "country"}
                    country={selectedCountry}
                    countries={comparisonCountryPool}
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
                    isActive={currentRoute === "hiddenGems"}
                    country={selectedCountry}
                    countries={comparisonCountryPool}
                    availableYears={apiAvailableYears}
                    onSelectCountry={(countryId) => setSelectedCountryId(countryId)}
                    selectedYear={selectedYear}
                    onChangeYear={(year) => handleYearChange(year, `${selectedCountry.name} hidden gems`)}
                    onSetLoading={handleHiddenGemsLoading}
                    showNavIntro={showHiddenGemsNavIntro}
                    onDismissNavIntro={() => setShowHiddenGemsNavIntro(false)}
                    focusSelection={hiddenGemsFocusSelection}
                    onFocusSelectionHandled={() => setHiddenGemsFocusSelection(null)}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="comparisonSelect" options={{ title: "Comparison Mode" }}>
                {() => (
                  <ComparisonSelectScreen
                    countries={comparisonCountryPool}
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
                    isActive={currentRoute === "comparisonResults"}
                    countries={selectedComparisonCountries}
                    availableCountries={comparisonCountryPool}
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
                {() => <DashboardScreen year={selectedYear} metrics={[]} countries={countries} />}
              </Stack.Screen>

              <Stack.Screen name="credits" component={CreditsScreen} options={{ title: "Credits" }} />
            </Stack.Navigator>
            <LoadingOverlay
              visible={Boolean(loadingMessage)}
              message={loadingMessage ?? undefined}
            />
          </View>
          <MobileBottomNav
            currentRoute={currentRoute}
            searchOpen={searchOpen}
            onNavigate={navigateToRoute}
            onToggleSearch={() => setSearchOpen((open) => !open)}
            onCloseSearch={() => setSearchOpen(false)}
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
    color: colors.textLight,
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
    position: "relative",
    overflow: "hidden",
  },
});
