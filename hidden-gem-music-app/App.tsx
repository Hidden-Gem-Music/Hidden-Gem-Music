import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "./src/components/AppHeader";
import { LoadingOverlay } from "./src/components/LoadingOverlay";
import { AppStateProvider, useAppState } from "./src/context/AppStateContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { linking } from "./src/navigation/linking";
import { navigationRef } from "./src/navigation/navigationRef";
import { colors } from "./src/theme/colors";
import { typefaces } from "./src/theme/typography";
import type { ScreenRoute } from "./src/types/navigation";

// ---------------------------------------------------------------------------
// App shell — rendered inside AppStateProvider, wraps NavigationContainer
// ---------------------------------------------------------------------------

function AppShell() {
  const {
    countries,
    loadingMessage,
    searchOpen,
    setSearchOpen,
    setSelectedCountryId,
    selectedCountry,
  } = useAppState();

  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>("welcome");

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
      case "search":
        return [
          { label: "Home", route: "welcome" as ScreenRoute },
          { label: "Search", route: "search" as ScreenRoute },
        ];
      default:
        return [{ label: "Home", route: "welcome" as ScreenRoute }];
    }
  }, [currentRoute, selectedCountry.name]);

  const handleNavigate = (route: ScreenRoute) => {
    if (navigationRef.isReady()) navigationRef.navigate(route);
  };

  const syncRoute = () => {
    const name = navigationRef.getCurrentRoute()?.name as ScreenRoute | undefined;
    if (name) setCurrentRoute(name);
  };

  return (
    <View style={styles.appShell}>
      <StatusBar style="light" />
      <AppHeader
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((open) => !open)}
        onCloseSearch={() => setSearchOpen(false)}
        countries={countries}
        onOpenCountry={(countryId) => {
          setSelectedCountryId(countryId);
          handleNavigate("country");
        }}
      />
      <View style={styles.screenArea}>
        <NavigationContainer
          ref={navigationRef}
          linking={linking}
          onReady={syncRoute}
          onStateChange={syncRoute}
          documentTitle={{ enabled: false }}
        >
          <AppNavigator />
        </NavigationContainer>
      </View>
      <View pointerEvents="box-none" style={styles.breadcrumbWrap}>
        <View style={styles.breadcrumbRow}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <View key={`${crumb.label}-${index}`} style={styles.breadcrumbItem}>
                {crumb.route && !isLast ? (
                  <Pressable onPress={() => handleNavigate(crumb.route!)} hitSlop={6}>
                    <Text
                      style={[styles.breadcrumbText, index === 0 ? styles.breadcrumbHome : styles.breadcrumbLink]}
                    >
                      {crumb.label}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.breadcrumbText, isLast ? styles.breadcrumbCurrent : null]}>
                    {crumb.label}
                  </Text>
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

// ---------------------------------------------------------------------------
// Root — loads fonts, injects web scrollbar styles, provides state context
// ---------------------------------------------------------------------------

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

  useEffect(() => {
    if (typeof document === "undefined") return;

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

  if (!fontsLoaded) {
    return <View style={styles.appShell} />;
  }

  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
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
