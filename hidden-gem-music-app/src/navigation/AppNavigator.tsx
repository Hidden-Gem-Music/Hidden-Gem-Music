import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { useAppState } from "../context/AppStateContext";
import { searchLibrary } from "../data/mockData";
import { ComparisonResultsScreen } from "../screens/ComparisonResultsScreen";
import { ComparisonSelectScreen } from "../screens/ComparisonSelectScreen";
import { CountryScreen } from "../screens/CountryScreen";
import { CreditsScreen } from "../screens/CreditsScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DiscoveryScreen } from "../screens/DiscoveryScreen";
import { HiddenGemsScreen } from "../screens/HiddenGemsScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import type { AppNavigation, RootStackParamList, ScreenRoute } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

// ---------------------------------------------------------------------------
// Screen wrappers — adapt React Navigation props to the existing screen APIs.
// All shared state is pulled from AppStateContext; navigation uses the hook.
// ---------------------------------------------------------------------------

function WelcomeWrapper() {
  const navigation = useNavigation<AppNavigation>();
  const { countries, selectedYear, handleYearChange, setSelectedCountryId } = useAppState();
  return (
    <WelcomeScreen
      countries={countries}
      onNavigate={(route: ScreenRoute) => navigation.navigate(route)}
      onSelectCountry={(countryId) => {
        setSelectedCountryId(countryId);
        navigation.navigate("country");
      }}
      selectedYear={selectedYear}
      onChangeYear={(year) => handleYearChange(year, "Welcome preview")}
    />
  );
}

function DiscoveryWrapper() {
  const navigation = useNavigation<AppNavigation>();
  const {
    countries,
    selectedCountryId,
    selectedYear,
    handleYearChange,
    setSelectedCountryId,
  } = useAppState();
  return (
    <DiscoveryScreen
      countries={countries}
      selectedCountryId={selectedCountryId}
      onSelectCountry={(countryId) => setSelectedCountryId(countryId)}
      onOpenCountry={(countryId) => {
        setSelectedCountryId(countryId);
        navigation.navigate("country");
      }}
      selectedYear={selectedYear}
      onChangeYear={(year) => handleYearChange(year, "Discovery Globe")}
    />
  );
}

function CountryWrapper() {
  const navigation = useNavigation<AppNavigation>();
  const { selectedCountry, selectedYear, handleYearChange } = useAppState();
  return (
    <CountryScreen
      country={selectedCountry}
      onNavigate={(route: ScreenRoute) => navigation.navigate(route)}
      selectedYear={selectedYear}
      onChangeYear={(year) => handleYearChange(year, `${selectedCountry.name} overview`)}
    />
  );
}

function HiddenGemsWrapper() {
  const { selectedCountry, songs, selectedSongId, selectedSong, setSelectedSongId, selectedYear, handleYearChange } =
    useAppState();
  return (
    <HiddenGemsScreen
      country={selectedCountry}
      songs={songs}
      selectedSongId={selectedSongId}
      selectedSong={selectedSong ?? songs[0]}
      onSelectSong={setSelectedSongId}
      selectedYear={selectedYear}
      onChangeYear={(year) => handleYearChange(year, `${selectedCountry.name} hidden gems`)}
    />
  );
}

function ComparisonSelectWrapper() {
  const navigation = useNavigation<AppNavigation>();
  const { countries, comparisonIds, setComparisonIds, selectedYear, handleYearChange } = useAppState();
  return (
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
      onDone={() => navigation.navigate("comparisonResults")}
      selectedYear={selectedYear}
      onChangeYear={(year) => handleYearChange(year, "Comparison Mode")}
    />
  );
}

function ComparisonResultsWrapper() {
  const navigation = useNavigation<AppNavigation>();
  const { selectedComparisonCountries, selectedYear } = useAppState();
  return (
    <ComparisonResultsScreen
      countries={selectedComparisonCountries}
      selectedYear={selectedYear}
      onBack={() => navigation.goBack()}
    />
  );
}

function DashboardWrapper() {
  const { selectedYear, dashboardMetrics, countries } = useAppState();
  return <DashboardScreen year={selectedYear} metrics={dashboardMetrics} countries={countries} />;
}

function SearchWrapper() {
  const navigation = useNavigation<AppNavigation>();
  const { countries, selectedYear, setSelectedCountryId, setSelectedSongId } = useAppState();
  return (
    <SearchScreen
      countries={countries}
      selectedYear={selectedYear}
      searchLibrary={searchLibrary}
      onOpenCountry={(countryId) => {
        setSelectedCountryId(countryId);
        navigation.navigate("country");
      }}
      onOpenSong={(countryId, songId) => {
        setSelectedCountryId(countryId);
        setSelectedSongId(songId);
        navigation.navigate("hiddenGems");
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Root stack navigator
// ---------------------------------------------------------------------------

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "fade" }}
      initialRouteName="welcome"
    >
      <Stack.Screen name="welcome" component={WelcomeWrapper} />
      <Stack.Screen name="discovery" component={DiscoveryWrapper} />
      <Stack.Screen name="country" component={CountryWrapper} />
      <Stack.Screen name="hiddenGems" component={HiddenGemsWrapper} />
      <Stack.Screen name="comparisonSelect" component={ComparisonSelectWrapper} />
      <Stack.Screen name="comparisonResults" component={ComparisonResultsWrapper} />
      <Stack.Screen name="dashboard" component={DashboardWrapper} />
      <Stack.Screen name="credits" component={CreditsScreen} />
      <Stack.Screen name="search" component={SearchWrapper} />
    </Stack.Navigator>
  );
}
