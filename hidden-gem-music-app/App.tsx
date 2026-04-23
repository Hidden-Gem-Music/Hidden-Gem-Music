import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "./src/components/AppHeader";
import { LoadingOverlay } from "./src/components/LoadingOverlay";
import { CreditsScreen } from "./src/screens/CreditsScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { DiscoveryScreen } from "./src/screens/DiscoveryScreen";
import { ComparisonResultsScreen } from "./src/screens/ComparisonResultsScreen";
import { ComparisonSelectScreen } from "./src/screens/ComparisonSelectScreen";
import { CountryScreen } from "./src/screens/CountryScreen";
import { HiddenGemsScreen } from "./src/screens/HiddenGemsScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import {
  getCountriesForYear,
  getCountryByYear,
  getDashboardMetrics,
  getDefaultComparisonIds,
  getFeaturedCountry,
  getSongsForCountryYear,
} from "./src/data/mockData";
import { ScreenRoute } from "./src/types/navigation";
import { colors } from "./src/theme/colors";
import { typefaces } from "./src/theme/typography";

const validRoutes: ScreenRoute[] = [
  "welcome",
  "discovery",
  "country",
  "hiddenGems",
  "comparisonSelect",
  "comparisonResults",
  "dashboard",
  "credits",
];

function getRouteFromHash(): ScreenRoute {
  if (typeof window === "undefined" || !window.location || !window.location.hash) {
    return "welcome";
  }

  const route = window.location.hash.replace(/^#/, "");
  return validRoutes.includes(route as ScreenRoute) ? (route as ScreenRoute) : "welcome";
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "NyghtSerif-MediumItalic": require("./src/assets/fonts/NyghtSerif-MediumItalic.ttf"),
    "NyghtSerif-Regular": require("./src/assets/fonts/NyghtSerif-Regular.ttf"),
    "NyghtSerif-RegularItalic": require("./src/assets/fonts/NyghtSerif-RegularItalic.ttf"),
    "NyghtSerif-Bold": require("./src/assets/fonts/NyghtSerif-Bold.ttf"),
    "NyghtSerif-BoldItalic": require("./src/assets/fonts/NyghtSerif-BoldItalic.ttf"),
    "NyghtSerif-Dark": require("./src/assets/fonts/NyghtSerif-Dark.ttf"),
    "NyghtSerif-DarkItalic": require("./src/assets/fonts/NyghtSerif-DarkItalic.ttf"),
    "Tanklager-Kompakt": require("./src/assets/fonts/Tanklager-Kompakt.ttf"),
    "Tanklager-Original": require("./src/assets/fonts/Tanklager-Original.ttf"),
  });

  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [route, setRoute] = useState<ScreenRoute>(() => getRouteFromHash());
  const [selectedYear, setSelectedYear] = useState(2021);
  const countries = useMemo(() => getCountriesForYear(selectedYear), [selectedYear]);
  const featuredCountry = useMemo(() => getFeaturedCountry(selectedYear), [selectedYear]);
  const [selectedCountryId, setSelectedCountryId] = useState(featuredCountry.id);
  const songs = useMemo(() => getSongsForCountryYear(selectedCountryId, selectedYear), [selectedCountryId, selectedYear]);
  const [selectedSongId, setSelectedSongId] = useState(songs[0]?.id ?? "");
  const [comparisonIds, setComparisonIds] = useState<string[]>(getDefaultComparisonIds());
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

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
    switch (route) {
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
          { label: "Hidden Songs", route: null },
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
  }, [route, selectedCountry.name]);

  useEffect(() => {
    if (!songs.find((song) => song.id === selectedSongId)) {
      setSelectedSongId(songs[0]?.id ?? "");
    }
  }, [songs, selectedSongId]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.addEventListener) {
      return;
    }

    const handleHashChange = () => {
      setRoute(getRouteFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location || !window.history) {
      return;
    }

    const nextHash = `#${route}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
  }, [route]);

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
    <View style={styles.appShell}>
      <StatusBar style="light" />
      <AppHeader
        currentRoute={route}
        onNavigate={setRoute}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((open) => !open)}
        onCloseSearch={() => setSearchOpen(false)}
        countries={countries}
        onOpenCountry={(countryId) => {
          setSelectedCountryId(countryId);
          setRoute("country");
        }}
      />
      <View style={styles.screenArea}>
        {route === "welcome" ? (
          <WelcomeScreen
            countries={countries}
            onNavigate={setRoute}
            onSelectCountry={(countryId) => {
              setSelectedCountryId(countryId);
              setRoute("country");
            }}
            selectedYear={selectedYear}
            onChangeYear={(year) => handleYearChange(year, "Welcome preview")}
          />
        ) : null}

        {route === "discovery" ? (
          <DiscoveryScreen
            countries={countries}
            selectedCountryId={selectedCountryId}
            onSelectCountry={(countryId) => setSelectedCountryId(countryId)}
            onOpenCountry={(countryId) => {
              setSelectedCountryId(countryId);
              setRoute("country");
            }}
            selectedYear={selectedYear}
            onChangeYear={(year) => handleYearChange(year, "Discovery Globe")}
          />
        ) : null}

        {route === "country" ? (
          <CountryScreen
            country={selectedCountry}
            onNavigate={setRoute}
            selectedYear={selectedYear}
            onChangeYear={(year) => handleYearChange(year, `${selectedCountry.name} overview`)}
          />
        ) : null}

        {route === "hiddenGems" ? (
          <HiddenGemsScreen
            country={selectedCountry}
            songs={songs}
            selectedSongId={selectedSongId}
            selectedSong={selectedSong}
            onSelectSong={setSelectedSongId}
            selectedYear={selectedYear}
            onChangeYear={(year) => handleYearChange(year, `${selectedCountry.name} hidden gems`)}
          />
        ) : null}

        {route === "comparisonSelect" ? (
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
            onDone={() => setRoute("comparisonResults")}
            selectedYear={selectedYear}
            onChangeYear={(year) => handleYearChange(year, "Comparison Mode")}
          />
        ) : null}

        {route === "comparisonResults" ? (
          <ComparisonResultsScreen
            countries={selectedComparisonCountries}
            selectedYear={selectedYear}
            onBack={() => setRoute("comparisonSelect")}
          />
        ) : null}

        {route === "dashboard" ? (
          <DashboardScreen year={selectedYear} metrics={dashboardMetrics} countries={countries} />
        ) : null}
        {route === "credits" ? <CreditsScreen /> : null}
      </View>
      <View pointerEvents="box-none" style={styles.breadcrumbWrap}>
        <View style={styles.breadcrumbRow}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <View key={`${crumb.label}-${index}`} style={styles.breadcrumbItem}>
                {crumb.route && !isLast ? (
                  <Pressable onPress={() => setRoute(crumb.route!)} hitSlop={6}>
                    <Text
                      style={[styles.breadcrumbText, index === 0 ? styles.breadcrumbHome : styles.breadcrumbLink]}
                    >
                      {crumb.label}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.breadcrumbText, isLast ? styles.breadcrumbCurrent : null]}>{crumb.label}</Text>
                )}
                {!isLast ? <Text style={styles.breadcrumbSeparator}> / </Text> : null}
              </View>
            );
          })}
        </View>
      </View>
      <LoadingOverlay visible={Boolean(loadingMessage)} message={loadingMessage ?? undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenArea: {
    flex: 1,
  },
  breadcrumbWrap: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 10,
    alignItems: "flex-start",
    zIndex: 3,
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  breadcrumbText: {
    color: colors.text,
    fontFamily: typefaces.display,
    fontSize: 13,
    lineHeight: 18,
    opacity: 1,
  },
  breadcrumbLink: {
    textDecorationLine: "none",
  },
  breadcrumbHome: {
    textDecorationLine: "underline",
  },
  breadcrumbCurrent: {
    color: colors.text,
  },
  breadcrumbSeparator: {
    color: colors.text,
    fontFamily: typefaces.display,
    fontSize: 13,
    lineHeight: 18,
    opacity: 1,
  },
});
