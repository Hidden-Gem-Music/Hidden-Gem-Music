import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  getCountriesForYear,
  getCountryByYear,
  getDashboardMetrics,
  getDefaultComparisonIds,
  getFeaturedCountry,
  getSongsForCountryYear,
} from "../data/mockData";
import { Country, Song } from "../types/content";

type AppState = {
  selectedYear: number;
  selectedCountryId: string;
  selectedSongId: string;
  comparisonIds: string[];
  loadingMessage: string | null;
  searchOpen: boolean;
  countries: Country[];
  featuredCountry: Country;
  songs: Song[];
  selectedCountry: Country;
  selectedSong: Song | undefined;
  selectedComparisonCountries: Country[];
  dashboardMetrics: Array<{ label: string; value: string; detail: string }>;
  handleYearChange: (nextYear: number, context: string) => void;
  setSelectedCountryId: (id: string) => void;
  setSelectedSongId: (id: string) => void;
  setComparisonIds: React.Dispatch<React.SetStateAction<string[]>>;
  setLoadingMessage: (message: string | null) => void;
  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedYear, setSelectedYear] = useState(2021);
  const countries = useMemo(() => getCountriesForYear(selectedYear), [selectedYear]);
  const featuredCountry = useMemo(() => getFeaturedCountry(selectedYear), [selectedYear]);
  const [selectedCountryId, setSelectedCountryId] = useState(featuredCountry.id);
  const songs = useMemo(
    () => getSongsForCountryYear(selectedCountryId, selectedYear),
    [selectedCountryId, selectedYear]
  );
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

  const dashboardMetrics = useMemo(
    () => getDashboardMetrics(selectedYear, countries),
    [countries, selectedYear]
  );

  const handleYearChange = (nextYear: number, context: string) => {
    if (nextYear === selectedYear) return;
    setLoadingMessage(`Refreshing ${context} for ${nextYear}...`);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      setSelectedYear(nextYear);
      setLoadingMessage(null);
    }, 500);
  };

  useEffect(() => {
    if (!songs.find((song) => song.id === selectedSongId)) {
      setSelectedSongId(songs[0]?.id ?? "");
    }
  }, [songs, selectedSongId]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  const value: AppState = {
    selectedYear,
    selectedCountryId,
    selectedSongId,
    comparisonIds,
    loadingMessage,
    searchOpen,
    countries,
    featuredCountry,
    songs,
    selectedCountry,
    selectedSong,
    selectedComparisonCountries,
    dashboardMetrics,
    handleYearChange,
    setSelectedCountryId,
    setSelectedSongId,
    setComparisonIds,
    setLoadingMessage,
    setSearchOpen,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
