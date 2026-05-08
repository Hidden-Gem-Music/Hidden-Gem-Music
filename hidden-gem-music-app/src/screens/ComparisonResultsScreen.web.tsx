import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { ActionButton } from "../components/ActionButton";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { loadAvailableYears, loadCountryHiddenGemsPreview, loadCountryProfile, loadCountrySongsPage } from "../data/countryApi";
import { mapApiCountryProfile, mapApiSong } from "../data/apiMappers";
import { Country, Song } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  countries: Country[];
  availableCountries: Country[];
  selectedYear: number;
  onBack: () => void;
  onChangeYear: (year: number) => void;
  onChangeCountryAtIndex: (index: number, countryId: string) => void;
  onOpenCountry: (countryId: string) => void;
  onOpenHiddenGemsForCountry: (
    countryId: string,
    selection?: { songTitle?: string; artist?: string }
  ) => void;
};

type SongPreview = {
  title: string;
  artist: string;
  detail: string;
  score: number;
};

type BreakdownItem = {
  label: string;
  percent: number;
};

type CountryProfileViewModel = {
  totalCharted: number;
  sharedCount: number;
  uniqueCount: number;
  overlapPercent: number;
  distinctPercent: number;
  summary: string;
  sharedSongs: SongPreview[];
  uniqueSongs: SongPreview[];
  hiddenGems: SongPreview[];
  genreBreakdown: BreakdownItem[];
  languageBreakdown: BreakdownItem[];
};

const vibeTerms = ["Radio Lift", "Night Signal", "Late Echo", "City Current", "Bright Repeat", "Afterglow Cut"];
const hiddenTerms = ["Buried Signal", "Quiet Circuit", "Glass Room", "Moon Static", "Deep Receiver", "Soft Relay"];
const genreChartColors = ["#4F5978", "#64718F", "#7786A4", "#90A0BC", "#AAB8D0", "#C6D2E5"];
const languageChartColors = ["#51607E", "#68789A", "#8292B0", "#9FADD0"];
const carouselBackdropColors = ["#B86A72", "#8B9BC0", "#8B5E7A", "#627F8A", "#C28C5E", "#7A7EB0"];
const cdCaseSource = require("../assets/images/CD-Case-Transparent-Image.png");
const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const carouselSizes = [300, 228, 198, 172, 150, 136, 124, 114] as const;
const carouselScales = [1, 0.93, 0.85, 0.77, 0.7, 0.64, 0.58, 0.52] as const;
const carouselOverlap = 76;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return hash;
}

function getCarouselVisualSize(offsetDistance: number) {
  return carouselSizes[Math.min(offsetDistance, carouselSizes.length - 1)];
}

function getCarouselVisualScale(offsetDistance: number) {
  return carouselScales[Math.min(offsetDistance, carouselScales.length - 1)];
}

function getCarouselTranslateX(offset: number) {
  const distance = Math.abs(offset);

  if (distance === 0) {
    return 0;
  }

  let translateX = 0;
  for (let index = 1; index <= distance; index += 1) {
    const previousWidth = getCarouselVisualSize(index - 1) * getCarouselVisualScale(index - 1);
    const currentWidth = getCarouselVisualSize(index) * getCarouselVisualScale(index);
    translateX += (previousWidth + currentWidth) / 2 - carouselOverlap;
  }

  return offset < 0 ? -translateX : translateX;
}

function getWrappedIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function createPercentBreakdown(labels: string[], seed: number) {
  const safeLabels = labels.length > 0 ? labels : ["No Data"];
  const weights = safeLabels.map((_, index) => ((seed + index * 17) % 23) + 10);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  let runningTotal = 0;
  return safeLabels.map((label, index) => {
    const isLast = index === safeLabels.length - 1;
    const percent = isLast ? 100 - runningTotal : Math.round((weights[index] / totalWeight) * 100);
    runningTotal += percent;
    return { label, percent };
  });
}

function createSongPreview(title: string, artist: string, detail: string, score: number): SongPreview {
  return {
    title,
    artist,
    detail,
    score,
  };
}

function toSongPreview(song: { title: string; artist: string }, detail: string, score: number): SongPreview {
  return createSongPreview(song.title, song.artist, detail, score);
}

function buildCountryProfile(country: Country, year: number): CountryProfileViewModel {
  const seed = hashString(`${country.code}-${year}`);
  const totalCharted = clamp(
    56 + (seed % 28) + country.hiddenSongs + country.genres.length * 8 + country.languages.length * 6,
    60,
    128
  );
  const overlapPercent = clamp(42 + (seed % 24) + country.genres.length * 2 - country.languages.length, 36, 82);
  const sharedCount = Math.round(totalCharted * (overlapPercent / 100));
  const uniqueCount = totalCharted - sharedCount;
  const distinctPercent = 100 - overlapPercent;
  const leadArtist = country.featuredArtists[0] ?? country.albumArtist;
  const secondArtist = country.featuredArtists[1] ?? country.albumArtist;
  const thirdArtist = country.featuredArtists[2] ?? leadArtist;

  const sharedSongs = Array.from({ length: sharedCount }, (_, index) =>
    createSongPreview(
      index === 0 ? country.topSong : `${country.album} ${vibeTerms[(seed + index) % vibeTerms.length]}`,
      [country.albumArtist, leadArtist, secondArtist, thirdArtist][index % 4],
      index % 2 === 0 ? "Loved in this country and echoed across other countries" : "Carries broad crossover pull beyond this country",
      clamp(overlapPercent + 10 - index, 44, 96)
    )
  );

  const uniqueSongs = Array.from({ length: uniqueCount }, (_, index) =>
    createSongPreview(
      index === 0 ? `${country.region} Private Mix` : `${country.name} ${hiddenTerms[(seed + index) % hiddenTerms.length]}`,
      [leadArtist, secondArtist, thirdArtist, country.albumArtist][index % 4],
      index % 2 === 0 ? `Feels especially loved in ${country.name}` : `Shows a more country-specific listening pull for ${country.name}`,
      clamp(distinctPercent + 28 - index, 38, 95)
    )
  );

  const hiddenGems = Array.from({ length: 5 }, (_, index) =>
    createSongPreview(
      index === 0 ? `${country.topSong} (Hidden Gem Cut)` : `${country.name} ${hiddenTerms[(seed + index) % hiddenTerms.length]}`,
      [country.albumArtist, leadArtist, secondArtist, thirdArtist][index % 4],
      "TrendScore preview",
      clamp(country.hiddenSongs * 11 + 27 - index * 2, 34, 97)
    )
  );

  const genreBreakdown = createPercentBreakdown(country.genres, seed + 13);
  const languageBreakdown = createPercentBreakdown(country.languages, seed + 41);
  const summary = `In this ${year} view of ${country.name}, ${totalCharted} songs are included in our data. ${sharedCount} of those songs are also popular in other countries, while ${uniqueCount} are most loved in ${country.name}.`;

  return {
    totalCharted,
    sharedCount,
    uniqueCount,
    overlapPercent,
    distinctPercent,
    summary,
    sharedSongs,
    uniqueSongs,
    hiddenGems,
    genreBreakdown,
    languageBreakdown,
  };
}

function CountryPageSection({
  children,
  style,
  fillVariant = "default",
  contentStyle,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  fillVariant?: "default" | "blurb" | "softBlue" | "comparisonBlue";
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <Panel style={[styles.secondaryPanel, style]}>
      {fillVariant === "blurb" ? (
        <LinearGradient
          colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.42)", "rgba(66,72,101,0.72)"]}
          locations={[0, 0.42, 0.78, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.customFill}
        />
      ) : fillVariant === "softBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#5D6983", colors.backgroundBottom]}
          locations={[0, 0.48, 0.82, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.customFill}
        />
      ) : fillVariant === "comparisonBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#70536A"]}
          locations={[0, 0.38, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.customFill}
        />
      ) : (
        <SecondarySurfaceFill />
      )}
      <View style={[styles.secondaryPanelContent, contentStyle]}>{children}</View>
    </Panel>
  );
}

function StatSquare({
  label,
  value,
  note,
  style,
}: {
  label: string;
  value: string;
  note: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <CountryPageSection style={[styles.statSquare, style]} contentStyle={styles.statSquareContent}>
      <Text style={styles.statSquareLabel}>{label}</Text>
      <Text style={styles.statSquareValue}>{value}</Text>
      <Text style={styles.statSquareNote}>{note}</Text>
    </CountryPageSection>
  );
}

function CdCase({
  size,
  artColor,
  withArtBackdrop = true,
}: {
  size: number;
  artColor?: string;
  withArtBackdrop?: boolean;
}) {
  return (
    <View style={[styles.cdCaseFrame, { width: size, height: size }]}>
      {withArtBackdrop ? (
        <View style={styles.cdCaseBackdropWrap}>
          <View
            style={[
              styles.cdCaseBackdrop,
              {
                width: Math.round(size * 0.82),
                height: Math.round(size * 0.82),
                backgroundColor: artColor ?? "rgba(108,119,142,0.42)",
              },
            ]}
          />
        </View>
      ) : null}
      <Image source={cdCaseSource} style={[styles.cdCaseImage, { width: size, height: size }]} resizeMode="contain" />
    </View>
  );
}

function CarouselArrowButton({
  direction,
  onPress,
  disabled = false,
  compact = false,
}: {
  direction: "left" | "right";
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.hiddenSongsCarouselArrowButton,
        compact ? styles.hiddenSongsCarouselArrowButtonCompact : null,
        disabled ? styles.hiddenSongsCarouselArrowButtonDisabled : null,
      ]}
    >
      <View style={styles.hiddenSongsCarouselArrowButtonInner}>
        <GemIcon
          size={compact ? 28 : 38}
          style={direction === "left" ? styles.hiddenSongsCarouselArrowLeft : styles.hiddenSongsCarouselArrowRight}
        />
      </View>
    </Pressable>
  );
}

function ComparisonPaneDropdownStack({
  countryOptions,
  selectedCountryId,
  selectedYear,
  availableYears,
  onChangeCountry,
  onChangeYear,
}: {
  countryOptions: Country[];
  selectedCountryId: string;
  selectedYear: number;
  availableYears: number[];
  onChangeCountry: (countryId: string) => void;
  onChangeYear: (year: number) => void;
}) {
  const yearOptions = useMemo(() => [...availableYears], [availableYears]);
  const selectedCountryName =
    countryOptions.find((countryOption) => countryOption.id === selectedCountryId)?.name ?? "Select Country";
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isCountryDropdownHovered, setIsCountryDropdownHovered] = useState(false);
  const [isYearDropdownHovered, setIsYearDropdownHovered] = useState(false);
  const [isCountryDropdownPressed, setIsCountryDropdownPressed] = useState(false);
  const [isYearDropdownPressed, setIsYearDropdownPressed] = useState(false);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const showCountryDropdownGradient =
    isCountryDropdownOpen || isCountryDropdownHovered || isCountryDropdownPressed;
  const showYearDropdownGradient = isYearDropdownOpen || isYearDropdownHovered || isYearDropdownPressed;

  return (
    <View style={styles.paneDropdownStack}>
      <View style={[styles.paneDropdownWrap, styles.paneCountryDropdownWrap]}>
        <Pressable
          onPress={() => {
            setIsCountryDropdownOpen((current) => !current);
            setIsYearDropdownOpen(false);
          }}
          onHoverIn={() => setIsCountryDropdownHovered(true)}
          onHoverOut={() => setIsCountryDropdownHovered(false)}
          onPressIn={() => setIsCountryDropdownPressed(true)}
          onPressOut={() => setIsCountryDropdownPressed(false)}
          style={styles.paneDropdownShell}
        >
          {showCountryDropdownGradient ? (
            <LinearGradient
              colors={isCountryDropdownPressed ? activeGradient : hoverGradient}
              locations={[0, 0.34, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.paneDropdownButtonGradient}
            />
          ) : null}
          <View style={[styles.paneDropdownButton, showCountryDropdownGradient ? styles.paneDropdownButtonActive : null]}>
            <Text style={styles.paneDropdownText} numberOfLines={1}>
              {selectedCountryName}
            </Text>
            <Text style={styles.paneDropdownChevron}>{isCountryDropdownOpen ? "-" : "+"}</Text>
          </View>
        </Pressable>
        {isCountryDropdownOpen ? (
          <Panel style={styles.paneDropdownMenu}>
            <SecondarySurfaceFill />
            <ScrollView style={styles.paneDropdownScroll} contentContainerStyle={styles.paneDropdownContent}>
              {countryOptions.map((countryOption) => {
                const selected = selectedCountryId === countryOption.id;
                const hovered = hoveredCountryId === countryOption.id;
                const showOptionGradient = selected || hovered;

                return (
                  <Pressable
                    key={countryOption.id}
                    onHoverIn={() => setHoveredCountryId(countryOption.id)}
                    onHoverOut={() => setHoveredCountryId((current) => (current === countryOption.id ? null : current))}
                    onPress={() => {
                      onChangeCountry(countryOption.id);
                      setIsCountryDropdownOpen(false);
                    }}
                    style={styles.paneDropdownOptionShell}
                  >
                    {showOptionGradient ? (
                      <LinearGradient
                        colors={selected ? activeGradient : hoverGradient}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.paneDropdownOptionGradient}
                      />
                    ) : null}
                    <View style={[styles.paneDropdownOption, showOptionGradient ? styles.paneDropdownOptionActive : null]}>
                      <Text
                        style={[
                          styles.paneDropdownOptionText,
                          showOptionGradient ? styles.paneDropdownOptionTextActive : null,
                        ]}
                      >
                        {countryOption.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Panel>
        ) : null}
      </View>

      <View style={[styles.paneDropdownWrap, styles.paneBottomYearDropdownWrap]}>
        <Pressable
          onPress={() => {
            setIsYearDropdownOpen((current) => !current);
            setIsCountryDropdownOpen(false);
          }}
          onHoverIn={() => setIsYearDropdownHovered(true)}
          onHoverOut={() => setIsYearDropdownHovered(false)}
          onPressIn={() => setIsYearDropdownPressed(true)}
          onPressOut={() => setIsYearDropdownPressed(false)}
          style={styles.paneDropdownShell}
        >
          {showYearDropdownGradient ? (
            <LinearGradient
              colors={isYearDropdownPressed ? activeGradient : hoverGradient}
              locations={[0, 0.34, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.paneDropdownButtonGradient}
            />
          ) : null}
          <View style={[styles.paneDropdownButton, showYearDropdownGradient ? styles.paneDropdownButtonActive : null]}>
            <Text style={styles.paneDropdownText}>{selectedYear}</Text>
            <Text style={styles.paneDropdownChevron}>{isYearDropdownOpen ? "-" : "+"}</Text>
          </View>
        </Pressable>
        {isYearDropdownOpen ? (
          <Panel style={styles.paneDropdownMenu}>
            <SecondarySurfaceFill />
            <ScrollView style={styles.paneDropdownScroll} contentContainerStyle={styles.paneDropdownContent}>
              {yearOptions.map((year) => {
                const selected = selectedYear === year;
                const hovered = hoveredYear === year;
                const showOptionGradient = selected || hovered;

                return (
                  <Pressable
                    key={year}
                    onHoverIn={() => setHoveredYear(year)}
                    onHoverOut={() => setHoveredYear((current) => (current === year ? null : current))}
                    onPress={() => {
                      onChangeYear(year);
                      setIsYearDropdownOpen(false);
                    }}
                    style={styles.paneDropdownOptionShell}
                  >
                    {showOptionGradient ? (
                      <LinearGradient
                        colors={selected ? activeGradient : hoverGradient}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.paneDropdownOptionGradient}
                      />
                    ) : null}
                    <View style={[styles.paneDropdownOption, showOptionGradient ? styles.paneDropdownOptionActive : null]}>
                      <Text
                        style={[
                          styles.paneDropdownOptionText,
                          showOptionGradient ? styles.paneDropdownOptionTextActive : null,
                        ]}
                      >
                        {year}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Panel>
        ) : null}
      </View>
    </View>
  );
}

function MainComparisonArea({
  title,
  songs,
  onOpenHiddenGems,
  isInitialLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  darkTheme = false,
}: {
  title: string;
  songs: SongPreview[];
  onOpenHiddenGems: (selection?: { songTitle?: string; artist?: string }) => void;
  isInitialLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  darkTheme?: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const trackRef = useRef<View>(null);
  const [hoveredSongKey, setHoveredSongKey] = useState<string | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1);
  const scrollbarVisible = Platform.OS === "web" && viewportHeight > 0;
  const hasOverflow = scrollbarVisible && contentHeight > viewportHeight;
  const trackHeight = Math.max(viewportHeight - 20, 1);
  const thumbHeight = scrollbarVisible
    ? hasOverflow
      ? Math.max((viewportHeight / contentHeight) * viewportHeight, 52)
      : trackHeight
    : 0;
  const thumbTop = hasOverflow ? (scrollY / (contentHeight - viewportHeight)) * (viewportHeight - thumbHeight) : 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextScrollY = event.nativeEvent.contentOffset.y;
    setScrollY(nextScrollY);

    if (!hasMore || isLoadingMore || !onLoadMore || contentHeight <= 0 || viewportHeight <= 0) {
      return;
    }

    const remaining = contentHeight - (nextScrollY + viewportHeight);
    if (remaining < 220) {
      onLoadMore();
    }
  };

  const scrollToTrackLocation = (locationY: number) => {
    if (!hasOverflow || contentHeight <= viewportHeight) {
      return;
    }

    const nextThumbTop = Math.min(Math.max(locationY - thumbHeight / 2, 0), trackHeight - thumbHeight);
    const nextRatio = nextThumbTop / (trackHeight - thumbHeight);
    const nextScrollY = nextRatio * (contentHeight - viewportHeight);
    scrollRef.current?.scrollTo({ y: nextScrollY, animated: false });
    setScrollY(nextScrollY);
  };

  const scrollToClientY = (clientY: number) => {
    const rect = (trackRef.current as any)?.getBoundingClientRect?.();
    if (!rect) {
      return;
    }

    scrollToTrackLocation(clientY - rect.top);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || !isDraggingScrollbar || typeof document === "undefined") {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;

    const handleMove = (event: MouseEvent) => {
      event.preventDefault();
      scrollToClientY(event.clientY);
    };

    const handleUp = () => {
      setIsDraggingScrollbar(false);
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingScrollbar, hasOverflow, thumbHeight, trackHeight, contentHeight, viewportHeight]);

  useEffect(() => {
    if (!isInitialLoading) {
      setLoadingDots(1);
      return;
    }

    const timer = setInterval(() => {
      setLoadingDots((current) => (current >= 3 ? 1 : current + 1));
    }, 350);

    return () => clearInterval(timer);
  }, [isInitialLoading]);

  return (
    <View style={styles.mainComparisonArea}>
      <Text style={[styles.panelTitle, darkTheme ? styles.panelTitleDark : null]}>{title}</Text>
      <View style={styles.mainComparisonListFrame}>
        <ScrollView
          ref={scrollRef}
          style={styles.mainComparisonScroll}
          contentContainerStyle={styles.mainComparisonListContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={Platform.OS !== "web"}
          onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {songs.length === 0 && isInitialLoading ? (
            <View style={styles.songListLoadingRow}>
              <Text style={[styles.songListLoadingText, darkTheme ? styles.songListLoadingTextDark : null]}>
                {`Loading${".".repeat(loadingDots)}`}
              </Text>
            </View>
          ) : null}
          {songs.map((song, index) => (
            <Pressable
              key={`${title}-${song.title}-${song.artist}-${index}`}
              onPress={() => onOpenHiddenGems({ songTitle: song.title, artist: song.artist })}
              onHoverIn={() => setHoveredSongKey(`${title}-${song.title}-${song.artist}-${index}`)}
              onHoverOut={() =>
                setHoveredSongKey((current) =>
                  current === `${title}-${song.title}-${song.artist}-${index}` ? null : current
                )
              }
              style={styles.songRowShell}
            >
              {({ pressed }) => {
                const songKey = `${title}-${song.title}-${song.artist}-${index}`;
                const showGradient = hoveredSongKey === songKey || pressed;

                return (
                  <>
                    {showGradient ? (
                      <LinearGradient
                        colors={pressed ? activeGradient : hoverGradient}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.songRowGradient}
                      />
                    ) : null}
                    <View style={[styles.songRow, showGradient ? styles.songRowActive : null]}>
                      <View style={styles.songCopy}>
                        <Text
                          style={[
                            styles.songTitle,
                            darkTheme ? styles.songTitleDark : null,
                            showGradient ? (darkTheme ? styles.songTextActiveDark : styles.songTextActive) : null,
                          ]}
                        >
                          {song.title}
                        </Text>
                        <Text
                          style={[
                            styles.songMeta,
                            darkTheme ? styles.songMetaDark : null,
                            showGradient ? (darkTheme ? styles.songTextActiveDark : styles.songTextActive) : null,
                          ]}
                        >
                          {song.artist}
                        </Text>
                      </View>
                      <CdCase size={84} artColor={carouselBackdropColors[index % carouselBackdropColors.length]} />
                    </View>
                  </>
                );
              }}
            </Pressable>
          ))}
          {isLoadingMore ? (
            <View style={styles.songListLoadingRow}>
              <Text style={[styles.songListLoadingText, darkTheme ? styles.songListLoadingTextDark : null]}>Loading more...</Text>
            </View>
          ) : null}
        </ScrollView>
        {scrollbarVisible ? (
          <View
            ref={trackRef}
            style={styles.mainComparisonScrollbarTrack}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => scrollToTrackLocation(event.nativeEvent.locationY)}
            onResponderMove={(event) => scrollToTrackLocation(event.nativeEvent.locationY)}
            {...(Platform.OS === "web"
              ? ({
                  onMouseDown: (event: any) => {
                    event.preventDefault();
                    setIsDraggingScrollbar(true);
                    scrollToClientY(event.clientY);
                  },
                } as any)
              : {})}
          >
            <View style={[styles.mainComparisonScrollbarThumb, { height: thumbHeight, transform: [{ translateY: thumbTop }] }]} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function GenreSection({
  title,
  items,
  visual = "bars",
}: {
  title: string;
  items: BreakdownItem[];
  visual?: "bars" | "pie";
}) {
  const pieGradient = useMemo(() => {
    let running = 0;
    const segments = items.map((item, index) => {
      const start = running;
      running += item.percent;
      const color = genreChartColors[index % genreChartColors.length];
      return `${color} ${start}% ${running}%`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, [items]);

  return (
    <CountryPageSection style={styles.genreSection} fillVariant="softBlue" contentStyle={styles.insightSectionContent}>
      <View style={styles.genreSectionHeader}>
        <Text style={styles.insightSectionTitle}>{title}</Text>
      </View>
      {visual === "pie" ? (
        <View style={styles.genreSectionPieLayout}>
          <View
            style={[
              styles.genreSectionPieChart,
              Platform.OS === "web"
                ? ({
                    backgroundImage: pieGradient,
                  } as ViewStyle)
                : styles.genreSectionPieChartFallback,
            ]}
          >
            <View style={styles.genreSectionPieChartInner} />
          </View>
          <View style={styles.genreSectionLegend}>
            {items.slice(0, 4).map((item, index) => (
              <View key={`${title}-${item.label}`} style={styles.genreSectionLegendRow}>
                <View style={[styles.genreSectionLegendDot, { backgroundColor: genreChartColors[index % genreChartColors.length] }]} />
                <Text style={styles.genreSectionLegendLabel}>{item.label}</Text>
                <Text style={styles.genreSectionLegendValue}>{item.percent}%</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.genreSectionBreakdownList}>
          {items.map((item) => (
            <View key={`${title}-${item.label}`} style={styles.genreSectionBreakdownRow}>
              <Text style={styles.genreSectionBreakdownLabel}>{item.label}</Text>
              <View style={styles.genreSectionBreakdownTrack}>
                <View style={[styles.genreSectionBreakdownFill, { width: `${item.percent}%` }]} />
              </View>
              <Text style={styles.genreSectionBreakdownValue}>{item.percent}%</Text>
            </View>
          ))}
        </View>
      )}
    </CountryPageSection>
  );
}

function LanguageSection({ title, items }: { title: string; items: BreakdownItem[] }) {
  const pieGradient = useMemo(() => {
    let running = 0;
    const segments = items.map((item, index) => {
      const start = running;
      running += item.percent;
      const color = languageChartColors[index % languageChartColors.length];
      return `${color} ${start}% ${running}%`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, [items]);

  return (
    <CountryPageSection style={styles.languageSection} fillVariant="softBlue" contentStyle={styles.insightSectionContent}>
      <View style={styles.genreSectionHeader}>
        <Text style={styles.insightSectionTitle}>{title}</Text>
      </View>
      <View style={styles.genreSectionPieLayout}>
        <View
          style={[
            styles.languageSectionPieChart,
            Platform.OS === "web"
              ? ({
                  backgroundImage: pieGradient,
                } as ViewStyle)
              : styles.genreSectionPieChartFallback,
          ]}
        >
          <View style={styles.languageSectionPieChartInner} />
        </View>
        <View style={styles.genreSectionLegend}>
          {items.slice(0, 4).map((item, index) => (
            <View key={`${title}-${item.label}`} style={styles.genreSectionLegendRow}>
              <View style={[styles.genreSectionLegendDot, { backgroundColor: languageChartColors[index % languageChartColors.length] }]} />
              <Text style={styles.genreSectionLegendLabel}>{item.label}</Text>
              <Text style={styles.genreSectionLegendValue}>{item.percent}%</Text>
            </View>
          ))}
        </View>
      </View>
    </CountryPageSection>
  );
}

function HiddenSongsCarouselSection({
  countryName,
  songs,
  isLoading,
  loadingText,
  onOpenHiddenGems,
}: {
  countryName: string;
  songs: Pick<Song, "title" | "artist">[];
  isLoading: boolean;
  loadingText: string;
  onOpenHiddenGems: (selection?: { songTitle?: string; artist?: string }) => void;
}) {
  const songCount = songs.length;
  const [activeIndex, setActiveIndex] = useState(songCount > 0 ? Math.floor(songCount / 2) : 0);
  const slots = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7] as const;

  useEffect(() => {
    setActiveIndex(songCount > 0 ? Math.floor(songCount / 2) : 0);
  }, [countryName, songCount]);

  const goPrevious = () => {
    if (songCount === 0) {
      return;
    }

    setActiveIndex((current) => getWrappedIndex(current - 1, songCount));
  };

  const goNext = () => {
    if (songCount === 0) {
      return;
    }

    setActiveIndex((current) => getWrappedIndex(current + 1, songCount));
  };

  const handleCarouselItemPress = (songIndex: number, isCenter: boolean) => {
    if (isLoading) {
      return;
    }

    const song = songs[songIndex];
    if (!song) {
      return;
    }

    if (isCenter) {
      onOpenHiddenGems({ songTitle: song.title, artist: song.artist });
      return;
    }

    setActiveIndex(songIndex);
  };

  return (
    <CountryPageSection style={styles.hiddenSongsCarouselSection} contentStyle={styles.hiddenSongsCarouselSectionContent}>
      <View style={styles.hiddenSongsCarouselHeader}>
        <View style={styles.hiddenSongsCarouselHeaderLeft}>
          <Text style={styles.panelTitle}>Preview {countryName}'s Hidden Gems</Text>
          <Text style={styles.hiddenSongsCarouselHelper}>
            {isLoading ? loadingText : "Click a song to listen to a 30 second preview on the Hidden Gems page."}
          </Text>
        </View>
        <Pressable onPress={() => onOpenHiddenGems()} style={styles.hiddenSongsCarouselHelperAction}>
          <Text style={styles.hiddenSongsCarouselHelperActionText}>{`Click here to view all of ${countryName}'s hidden gems`}</Text>
        </Pressable>
      </View>
      <View style={styles.hiddenSongsCarouselBody}>
        <CarouselArrowButton direction="left" onPress={goPrevious} />
        <View style={styles.hiddenSongsCarouselTrack}>
          {slots.map((offset) => {
            if (songCount === 0) {
              return null;
            }

            const songIndex = getWrappedIndex(activeIndex + offset, songCount);
            const song = songs[songIndex];
            const isCenter = offset === 0;
            const offsetDistance = Math.abs(offset);
            const size = getCarouselVisualSize(offsetDistance);
            const horizontalOffset = getCarouselTranslateX(offset);
            const verticalOffset = -18;
            const scale = getCarouselVisualScale(offsetDistance);

            return (
              <Pressable
                key={`${song.title}-${offset}`}
                onPress={() => handleCarouselItemPress(songIndex, isCenter)}
                style={[
                  styles.hiddenSongsCarouselItem,
                  {
                    transform: [{ translateX: horizontalOffset }, { translateY: verticalOffset }, { scale }],
                    opacity:
                      isCenter
                        ? 1
                        : offsetDistance >= 7
                          ? 0.24
                          : offsetDistance === 6
                            ? 0.28
                            : offsetDistance === 5
                              ? 0.34
                              : offsetDistance === 4
                                ? 0.42
                                : offsetDistance === 3
                                  ? 0.56
                                  : 0.8,
                    zIndex: 100 - Math.abs(offset),
                  },
                  Platform.OS === "web"
                    ? ({
                        transitionProperty: "transform, opacity",
                        transitionDuration: "320ms",
                        transitionTimingFunction: "ease",
                      } as any)
                    : null,
                ]}
              >
                <View style={styles.hiddenSongsCarouselCdSlot}>
                  <CdCase size={size} artColor={carouselBackdropColors[songIndex % carouselBackdropColors.length]} />
                </View>
                {isCenter ? (
                  <>
                    <Text style={styles.hiddenSongsCarouselSongTitle}>{song.title}</Text>
                    <Text style={styles.hiddenSongsCarouselSongArtist}>{song.artist}</Text>
                  </>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <CarouselArrowButton direction="right" onPress={goNext} />
      </View>
    </CountryPageSection>
  );
}

function FavoriteArtistsSection({
  country,
  selectedYear,
  artists,
  isLoading,
  onOpenHiddenGems,
}: {
  country: Country;
  selectedYear: number;
  artists: Array<{ artist: string; songTitle: string }>;
  isLoading: boolean;
  onOpenHiddenGems: (selection?: { songTitle?: string; artist?: string }) => void;
}) {
  const artistRows = Array.from({ length: 8 }, (_, index) => artists[index] ?? { artist: "", songTitle: "" });

  return (
    <CountryPageSection style={styles.snapshotPanel}>
      <Text style={styles.panelTitle}>{`${country.name}'s Favorite Artists in ${selectedYear}`}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        persistentScrollbar
        style={styles.favoriteArtistsScroll}
        contentContainerStyle={styles.favoriteArtistsRow}
      >
        {artistRows.map((artist, index) => (
          <Pressable
            key={`${artist.artist}-${artist.songTitle}-${index}`}
            onPress={() => {
              if (!isLoading && artist.artist) {
                onOpenHiddenGems({ artist: artist.artist, songTitle: artist.songTitle || undefined });
              }
            }}
            style={styles.favoriteArtistItem}
          >
            <CdCase size={104} artColor={carouselBackdropColors[index % carouselBackdropColors.length]} />
            <Text style={styles.favoriteArtistName} numberOfLines={3} ellipsizeMode="tail">
              {isLoading ? "Loading..." : artist.artist}
            </Text>
            <Text style={styles.favoriteArtistSongName} numberOfLines={3} ellipsizeMode="tail">
              {isLoading ? "Loading..." : artist.songTitle}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </CountryPageSection>
  );
}

function ComparisonCountryPane({
  availableCountries,
  unavailableCountryId,
  country,
  selectedYear,
  onChangeYear,
  onChangeCountry,
  onOpenCountry,
  onOpenHiddenGemsForCountry,
}: {
  availableCountries: Country[];
  unavailableCountryId?: string;
  country: Country;
  selectedYear: number;
  onChangeYear: (year: number) => void;
  onChangeCountry: (countryId: string) => void;
  onOpenCountry: (countryId: string) => void;
  onOpenHiddenGemsForCountry: (countryId: string, selection?: { songTitle?: string; artist?: string }) => void;
}) {
  const fallbackProfile = useMemo(() => buildCountryProfile(country, selectedYear), [country, selectedYear]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [apiProfile, setApiProfile] = useState<ReturnType<typeof mapApiCountryProfile> | null>(null);
  const [previewSongs, setPreviewSongs] = useState<Array<{ title: string; artist: string }>>([]);
  const [uniqueSongs, setUniqueSongs] = useState<SongPreview[]>([]);
  const [sharedSongs, setSharedSongs] = useState<SongPreview[]>([]);
  const [uniquePage, setUniquePage] = useState(1);
  const [sharedPage, setSharedPage] = useState(1);
  const [uniqueHasMore, setUniqueHasMore] = useState(false);
  const [sharedHasMore, setSharedHasMore] = useState(false);
  const [loadingMoreUnique, setLoadingMoreUnique] = useState(false);
  const [loadingMoreShared, setLoadingMoreShared] = useState(false);
  const [initialLoadingUnique, setInitialLoadingUnique] = useState(false);
  const [initialLoadingShared, setInitialLoadingShared] = useState(false);
  const [initialLoadingProfile, setInitialLoadingProfile] = useState(false);
  const [initialLoadingPreview, setInitialLoadingPreview] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1);
  const latestRequestRef = useRef(0);
  const countryOptions = useMemo(
    () =>
      availableCountries.filter((countryOption) =>
        unavailableCountryId ? countryOption.id === country.id || countryOption.id !== unavailableCountryId : true
      ),
    [availableCountries, country.id, unavailableCountryId]
  );
  const openForCountry = (selection?: { songTitle?: string; artist?: string }) =>
    onOpenHiddenGemsForCountry(country.id, selection);

  useEffect(() => {
    let cancelled = false;

    loadAvailableYears()
      .then((years) => {
        if (!cancelled && years.length > 0) {
          setAvailableYears(years);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn("Failed to load available years metadata for comparison pane. Falling back to current year selection.", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setUniqueSongs([]);
    setSharedSongs([]);
    setUniquePage(1);
    setSharedPage(1);
    setUniqueHasMore(false);
    setSharedHasMore(false);
    setLoadingMoreUnique(false);
    setLoadingMoreShared(false);
    setInitialLoadingUnique(true);
    setInitialLoadingShared(true);
    setInitialLoadingProfile(true);
    setInitialLoadingPreview(true);

    loadCountryProfile(country.code, selectedYear)
      .then((profilePayload) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        setApiProfile(mapApiCountryProfile(profilePayload));
        setInitialLoadingProfile(false);
      })
      .catch((error) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        console.warn(`Failed to load country profile API data for comparison pane ${country.code} ${selectedYear}.`, error);
        setApiProfile(null);
        setInitialLoadingProfile(false);
      });

    loadCountryHiddenGemsPreview(country.code, selectedYear, 13)
      .then((hiddenGemsPayload) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        setPreviewSongs(
          hiddenGemsPayload.map((item) => {
            return {
              title: item.songName?.trim() ? item.songName : "Unknown Song",
              artist: item.artistName?.trim() ? item.artistName : "Unknown Artist",
            };
          })
        );
        setInitialLoadingPreview(false);
      })
      .catch((error) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        console.warn(`Failed to load hidden gems preview API data for comparison pane ${country.code} ${selectedYear}.`, error);
        setPreviewSongs([]);
        setInitialLoadingPreview(false);
      });

    loadCountrySongsPage(country.code, selectedYear, "unique", 1, 50)
      .then((payload) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        setUniqueSongs(
          payload.items.map((song, index) =>
            toSongPreview(mapApiSong(song), `Feels especially loved in ${country.name}`, clamp(95 - index * 2, 34, 95))
          )
        );
        setUniqueHasMore(payload.hasMore);
        setInitialLoadingUnique(false);
      })
      .catch((error) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        console.warn(`Failed to load unique songs page for comparison pane ${country.code} ${selectedYear}.`, error);
        setUniqueSongs([]);
        setInitialLoadingUnique(false);
      });

    loadCountrySongsPage(country.code, selectedYear, "shared", 1, 50)
      .then((payload) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        setSharedSongs(
          payload.items.map((song, index) =>
            toSongPreview(mapApiSong(song), "Loved in this country and echoed across other countries", clamp(95 - index * 2, 34, 95))
          )
        );
        setSharedHasMore(payload.hasMore);
        setInitialLoadingShared(false);
      })
      .catch((error) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        console.warn(`Failed to load shared songs page for comparison pane ${country.code} ${selectedYear}.`, error);
        setSharedSongs([]);
        setInitialLoadingShared(false);
      });
  }, [country.code, country.name, selectedYear]);

  const yearOptions = useMemo(() => {
    if (availableYears.length === 0) {
      return [selectedYear];
    }
    if (availableYears.includes(selectedYear)) {
      return availableYears;
    }
    return [...availableYears, selectedYear].sort((a, b) => a - b);
  }, [availableYears, selectedYear]);

  const loadMoreUniqueSongs = () => {
    if (loadingMoreUnique || !uniqueHasMore) {
      return;
    }
    const requestId = latestRequestRef.current;
    const nextPage = uniquePage + 1;
    setLoadingMoreUnique(true);
    loadCountrySongsPage(country.code, selectedYear, "unique", nextPage, 50)
      .then((payload) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        setUniqueSongs((current) => {
          const nextItems = payload.items.map((song, index) =>
            toSongPreview(mapApiSong(song), `Feels especially loved in ${country.name}`, clamp(95 - (current.length + index) * 2, 34, 95))
          );
          return [...current, ...nextItems];
        });
        setUniquePage(nextPage);
        setUniqueHasMore(payload.hasMore);
      })
      .catch((error) => {
        if (latestRequestRef.current === requestId) {
          console.warn(`Failed loading additional unique songs for comparison pane ${country.code} ${selectedYear}.`, error);
        }
      })
      .finally(() => {
        if (latestRequestRef.current === requestId) {
          setLoadingMoreUnique(false);
        }
      });
  };

  const loadMoreSharedSongs = () => {
    if (loadingMoreShared || !sharedHasMore) {
      return;
    }
    const requestId = latestRequestRef.current;
    const nextPage = sharedPage + 1;
    setLoadingMoreShared(true);
    loadCountrySongsPage(country.code, selectedYear, "shared", nextPage, 50)
      .then((payload) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        setSharedSongs((current) => {
          const nextItems = payload.items.map((song, index) =>
            toSongPreview(mapApiSong(song), "Loved in this country and echoed across other countries", clamp(95 - (current.length + index) * 2, 34, 95))
          );
          return [...current, ...nextItems];
        });
        setSharedPage(nextPage);
        setSharedHasMore(payload.hasMore);
      })
      .catch((error) => {
        if (latestRequestRef.current === requestId) {
          console.warn(`Failed loading additional shared songs for comparison pane ${country.code} ${selectedYear}.`, error);
        }
      })
      .finally(() => {
        if (latestRequestRef.current === requestId) {
          setLoadingMoreShared(false);
        }
      });
  };

  const favoriteArtists = useMemo(() => {
    if (!apiProfile) {
      return [];
    }
    const selectedArtists: Array<{ artist: string; songTitle: string }> = [];
    const seen = new Set<string>();
    const addArtist = (name: string, songTitle: string) => {
      const normalized = name.trim().toLowerCase();
      if (!normalized || seen.has(normalized) || selectedArtists.length >= 8) {
        return;
      }
      seen.add(normalized);
      selectedArtists.push({ artist: name, songTitle });
    };
    apiProfile.topUniqueSongs.forEach((song) => addArtist(song.artist, song.title));
    if (selectedArtists.length < 8) {
      apiProfile.topSharedSongs.forEach((song) => addArtist(song.artist, song.title));
    }
    return selectedArtists;
  }, [apiProfile]);

  const hiddenGemSongs = useMemo(() => previewSongs, [previewSongs]);
  const profileStats = useMemo(
    () => ({
      totalCharted: apiProfile?.totalCharted ?? fallbackProfile.totalCharted,
      uniqueCount: apiProfile?.uniqueCount ?? fallbackProfile.uniqueCount,
      sharedCount: apiProfile?.sharedCount ?? fallbackProfile.sharedCount,
      overlapPercent: apiProfile?.overlapPercent ?? fallbackProfile.overlapPercent,
      uniqueSongs,
      sharedSongs,
      genreBreakdown: fallbackProfile.genreBreakdown,
      languageBreakdown: fallbackProfile.languageBreakdown,
    }),
    [apiProfile, fallbackProfile, sharedSongs, uniqueSongs]
  );

  const isCoreLoading = initialLoadingProfile || initialLoadingUnique || initialLoadingShared;
  const loadingText = `Loading${".".repeat(loadingDots)}`;

  useEffect(() => {
    if (!(isCoreLoading || initialLoadingPreview)) {
      setLoadingDots(1);
      return;
    }
    const timer = setInterval(() => {
      setLoadingDots((current) => (current >= 3 ? 1 : current + 1));
    }, 350);
    return () => clearInterval(timer);
  }, [initialLoadingPreview, isCoreLoading]);

  const generalDescriptionText = useMemo(() => {
    const genreA = country.genres[0] ?? "Unknown Genre";
    const genreB = country.genres[1] ?? genreA;
    const genreC = country.genres[2] ?? genreB;
    const artistA = favoriteArtists[0]?.artist;
    const artistB = favoriteArtists[1]?.artist;
    const songA = profileStats.uniqueSongs[0] ?? profileStats.sharedSongs[0];
    const songB = profileStats.uniqueSongs[1] ?? profileStats.sharedSongs[1] ?? profileStats.sharedSongs[0];
    if (!artistA || !artistB || !songA || !songB) {
      return `A mix of ${genreA}, ${genreB}, and ${genreC} are ${country.name}'s favorites in ${selectedYear}. Favorite artists include ${loadingText} and ${loadingText}, and favorite songs that year included ${loadingText} and ${loadingText}.`;
    }
    return `A mix of ${genreA}, ${genreB}, and ${genreC} are ${country.name}'s favorites in ${selectedYear}. Favorite artists include ${artistA} and ${artistB}, and favorite songs that year included ${songA.title} by ${songA.artist} and ${songB.title} by ${songB.artist}.`;
  }, [country.genres, country.name, favoriteArtists, loadingText, profileStats.sharedSongs, profileStats.uniqueSongs, selectedYear]);

  return (
    <Panel style={styles.paneShell}>
      <LinearGradient
        colors={[colors.surfaceSecondary, "#27293B", "#332E41", "#4A3E51", "#70536A"]}
        locations={[0, 0.34, 0.62, 0.84, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.paneFill}
      />
      <ScrollView
        style={styles.paneScroll}
        contentContainerStyle={styles.paneContent}
        showsVerticalScrollIndicator
        scrollEventThrottle={16}
      >
        <View style={styles.paneHeaderRow}>
          <View style={styles.headerCopy}>
            <Pressable onPress={() => onOpenCountry(country.id)} style={styles.pageTitlePressable}>
              <Text style={styles.pageTitle}>{country.name}</Text>
            </Pressable>
            <Text style={styles.pageSubtitle}>{country.region}</Text>
          </View>
          <ComparisonPaneDropdownStack
            countryOptions={countryOptions}
            selectedCountryId={country.id}
            selectedYear={selectedYear}
            availableYears={yearOptions}
            onChangeCountry={onChangeCountry}
            onChangeYear={onChangeYear}
          />
        </View>

        <CountryPageSection style={styles.countrySummarySection} fillVariant="comparisonBlue">
          <Text style={[styles.countrySummarySectionHeader, styles.countrySummarySectionTextDark]}>Country Summary</Text>

          <View style={styles.countrySummarySectionDetailsRow}>
            <View style={styles.countrySummarySectionDetailCard}>
              <View style={styles.countrySummarySectionDetailTitleWrap}>
                <Text style={[styles.countrySummarySectionDetailTitle, styles.countrySummarySectionTextDark]}>General Description</Text>
                <View style={styles.countrySummarySectionDetailTitleUnderline} />
              </View>
              <Text style={[styles.countrySummarySectionDetailText, styles.countrySummarySectionTextDark]}>{generalDescriptionText}</Text>
            </View>
            <View style={styles.countrySummarySectionDetailCard}>
              <View style={styles.countrySummarySectionDetailTitleWrap}>
                <Text style={[styles.countrySummarySectionDetailTitle, styles.countrySummarySectionTextDark]}>Genre + Language Mix</Text>
                <View style={styles.countrySummarySectionDetailTitleUnderline} />
              </View>
              <Text style={[styles.countrySummarySectionDetailText, styles.countrySummarySectionTextDark]}>
                {country.name}'s chart leans through {country.genres.join(", ")}, and includes but is not limited to
                {` ${country.languages.join(", ")}`} across the language mix represented here.
              </Text>
            </View>
          </View>
        </CountryPageSection>

        <FavoriteArtistsSection
          country={country}
          selectedYear={selectedYear}
          artists={favoriteArtists}
          isLoading={initialLoadingProfile}
          onOpenHiddenGems={openForCountry}
        />

        <View style={styles.statStripRow}>
          <StatSquare label="Songs in This View" value={isCoreLoading ? loadingText : `${profileStats.totalCharted}`} note="songs" style={styles.statStripItem} />
          <StatSquare label="Loved in This Country" value={isCoreLoading ? loadingText : `${profileStats.uniqueCount}`} note="songs" style={styles.statStripItem} />
          <StatSquare
            label="Loved Here and Elsewhere"
            value={isCoreLoading ? loadingText : `${profileStats.sharedCount}`}
            note="songs"
            style={styles.statStripItem}
          />
          <StatSquare
            label="Loved Here and Elsewhere"
            value={isCoreLoading ? loadingText : `${profileStats.overlapPercent}%`}
            note="% of this view"
            style={styles.statStripItem}
          />
        </View>

        <View style={styles.genreAndLanguageSections}>
          <GenreSection title={`${country.name}'s Loved Genres`} items={profileStats.genreBreakdown} visual="pie" />
          <LanguageSection title={`${country.name}'s Languages`} items={profileStats.languageBreakdown} />
        </View>

        <HiddenSongsCarouselSection
          countryName={country.name}
          songs={hiddenGemSongs}
          isLoading={initialLoadingPreview}
          loadingText={loadingText}
          onOpenHiddenGems={openForCountry}
        />

        <CountryPageSection style={styles.mainComparisonSection} fillVariant="comparisonBlue">
          <View style={styles.mainComparisonColumns}>
            <MainComparisonArea
              title="Most Loved in This Country"
              songs={profileStats.uniqueSongs}
              onOpenHiddenGems={openForCountry}
              isInitialLoading={initialLoadingUnique}
              hasMore={uniqueHasMore}
              isLoadingMore={loadingMoreUnique}
              onLoadMore={loadMoreUniqueSongs}
              darkTheme
            />
            <View style={styles.mainComparisonSectionDivider} />
            <MainComparisonArea
              title="Loved Here and Elsewhere"
              songs={profileStats.sharedSongs}
              onOpenHiddenGems={openForCountry}
              isInitialLoading={initialLoadingShared}
              hasMore={sharedHasMore}
              isLoadingMore={loadingMoreShared}
              onLoadMore={loadMoreSharedSongs}
              darkTheme
            />
          </View>
        </CountryPageSection>
      </ScrollView>
    </Panel>
  );
}

function EmptyPane() {
  return (
    <Panel style={styles.paneShell}>
      <LinearGradient
        colors={[colors.surfaceSecondary, "#27293B", "#332E41", "#4A3E51", "#70536A"]}
        locations={[0, 0.34, 0.62, 0.84, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.paneFill}
      />
      <View style={styles.emptyPaneInner}>
        <Text style={styles.emptyTitle}>Select Two Countries</Text>
        <Text style={styles.emptyText}>Comparison View needs two selected countries.</Text>
      </View>
    </Panel>
  );
}

export function ComparisonResultsScreen({
  countries,
  availableCountries,
  selectedYear,
  onBack,
  onChangeYear,
  onChangeCountryAtIndex,
  onOpenCountry,
  onOpenHiddenGemsForCountry,
}: Props) {
  const leftCountry = countries[0];
  const rightCountry = countries[1];
  const [leftPaneYear, setLeftPaneYear] = useState(selectedYear);
  const [rightPaneYear, setRightPaneYear] = useState(selectedYear);

  return (
    <ScreenScaffold>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <ActionButton label="Back to Comparison Mode" onPress={onBack} />
        </View>
        <View style={styles.panesRow}>
          {leftCountry ? (
            <ComparisonCountryPane
              availableCountries={availableCountries}
              unavailableCountryId={rightCountry?.id}
              country={leftCountry}
              selectedYear={leftPaneYear}
              onChangeYear={setLeftPaneYear}
              onChangeCountry={(countryId) => onChangeCountryAtIndex(0, countryId)}
              onOpenCountry={onOpenCountry}
              onOpenHiddenGemsForCountry={onOpenHiddenGemsForCountry}
            />
          ) : (
            <EmptyPane />
          )}
          {rightCountry ? (
            <ComparisonCountryPane
              availableCountries={availableCountries}
              unavailableCountryId={leftCountry?.id}
              country={rightCountry}
              selectedYear={rightPaneYear}
              onChangeYear={setRightPaneYear}
              onChangeCountry={(countryId) => onChangeCountryAtIndex(1, countryId)}
              onOpenCountry={onOpenCountry}
              onOpenHiddenGemsForCountry={onOpenHiddenGemsForCountry}
            />
          ) : (
            <EmptyPane />
          )}
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 10,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  panesRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: "row",
    gap: 14,
  },
  paneShell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "transparent",
    overflow: "hidden",
    padding: 0,
  },
  paneFill: {
    ...StyleSheet.absoluteFillObject,
  },
  paneScroll: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
        } as ViewStyle)
      : null),
  },
  paneContent: {
    gap: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 18,
    overflow: "visible",
  },
  paneHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    overflow: "visible",
    zIndex: 24,
  },
  headerCopy: {
    flex: 1,
    minWidth: 240,
    gap: 2,
    justifyContent: "flex-start",
  },
  pageTitlePressable: {
    alignSelf: "flex-start",
  },
  pageTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 52,
    lineHeight: 54,
  },
  pageSubtitle: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 18,
    lineHeight: 24,
  },
  paneDropdownStack: {
    width: 156,
    gap: 8,
    position: "relative",
    zIndex: 100,
    overflow: "visible",
  },
  paneDropdownWrap: {
    width: 156,
    position: "relative",
    zIndex: 10,
    alignItems: "stretch",
    justifyContent: "center",
  },
  paneCountryDropdownWrap: {
    zIndex: 14,
  },
  paneBottomYearDropdownWrap: {
    zIndex: 11,
  },
  paneDropdownShell: {
    borderRadius: 17,
    overflow: "hidden",
  },
  paneDropdownButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  paneDropdownButton: {
    minWidth: 156,
    minHeight: 38,
    height: 38,
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  paneDropdownButtonActive: {
    backgroundColor: "transparent",
  },
  paneDropdownText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    lineHeight: 18,
  },
  paneDropdownChevron: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 28,
    lineHeight: 28,
  },
  paneDropdownMenu: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 156,
    maxHeight: 260,
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
    zIndex: 9999,
    elevation: 9999,
  },
  paneDropdownScroll: {
    maxHeight: 260,
  },
  paneDropdownContent: {
    padding: 8,
    gap: 8,
  },
  paneDropdownOptionShell: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  paneDropdownOptionGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  paneDropdownOption: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
  },
  paneDropdownOptionActive: {
    backgroundColor: "transparent",
  },
  paneDropdownOptionText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
  },
  paneDropdownOptionTextActive: {
    color: colors.textLight,
  },
  secondaryPanel: {
    backgroundColor: "transparent",
    overflow: "hidden",
    padding: 0,
  },
  secondaryPanelContent: {
    padding: 18,
    gap: 16,
  },
  customFill: {
    ...StyleSheet.absoluteFillObject,
  },
  countrySummarySection: {
    minHeight: 0,
  },
  countrySummarySectionHeader: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 23,
    lineHeight: 27,
  },
  countrySummarySectionTextDark: {
    color: colors.border,
  },
  countrySummarySectionDetailsRow: {
    flexDirection: "column",
    gap: 16,
    alignItems: "stretch",
  },
  countrySummarySectionDetailCard: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.12)",
    padding: 14,
    alignSelf: "stretch",
  },
  countrySummarySectionDetailTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 19,
    lineHeight: 24,
  },
  countrySummarySectionDetailTitleWrap: {
    alignSelf: "flex-start",
    gap: 4,
  },
  countrySummarySectionDetailTitleUnderline: {
    width: "100%",
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.92,
  },
  countrySummarySectionDetailText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 24,
  },
  statStripRow: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  statStripItem: {
    flex: 1,
    minWidth: 0,
    height: 108,
  },
  statSquare: {
    borderWidth: 2,
    borderColor: "rgba(117, 82, 107, 0.42)",
    shadowColor: colors.accent,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  statSquareContent: {
    height: "100%",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
    justifyContent: "space-between",
  },
  statSquareLabel: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 14,
  },
  statSquareValue: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 26,
    lineHeight: 29,
  },
  statSquareNote: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 10,
    lineHeight: 13,
  },
  genreAndLanguageSections: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    alignItems: "stretch",
  },
  genreSection: {
    minWidth: 0,
    height: 152,
    maxHeight: 152,
    borderWidth: 2,
    borderColor: "rgba(117, 82, 107, 0.42)",
  },
  languageSection: {
    minWidth: 0,
    height: 152,
    maxHeight: 152,
    borderWidth: 2,
    borderColor: "rgba(117, 82, 107, 0.42)",
  },
  insightSectionContent: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    gap: 10,
    justifyContent: "space-between",
  },
  genreSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  insightSectionTitle: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 23,
    lineHeight: 27,
  },
  genreSectionPieLayout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  genreSectionPieChart: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  genreSectionPieChartFallback: {
    backgroundColor: colors.backgroundSoft,
  },
  genreSectionPieChartInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  languageSectionPieChart: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  languageSectionPieChartInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#75829C",
    borderWidth: 2,
    borderColor: "rgba(15,16,21,0.34)",
  },
  genreSectionLegend: {
    flex: 1,
    gap: 4,
  },
  genreSectionLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  genreSectionLegendDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  genreSectionLegendLabel: {
    flex: 1,
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 14,
  },
  genreSectionLegendValue: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 14,
  },
  genreSectionBreakdownList: {
    gap: 12,
  },
  genreSectionBreakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  genreSectionBreakdownLabel: {
    width: 110,
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
  },
  genreSectionBreakdownTrack: {
    flex: 1,
    height: 18,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(15,16,21,0.38)",
  },
  genreSectionBreakdownFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.backgroundSoft,
  },
  genreSectionBreakdownValue: {
    width: 42,
    textAlign: "right",
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
  },
  snapshotPanel: {
    minWidth: 320,
  },
  favoriteArtistsScroll: {
    ...(Platform.OS === "web"
      ? ({
          overflowX: "scroll",
          overflowY: "hidden",
        } as ViewStyle)
      : null),
  },
  panelTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 23,
    lineHeight: 27,
  },
  panelTitleDark: {
    color: colors.border,
  },
  favoriteArtistsControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  favoriteArtistsRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingBottom: 6,
  },
  favoriteArtistItem: {
    alignItems: "center",
    gap: 10,
    width: 118,
  },
  favoriteArtistName: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 17,
    textAlign: "center",
  },
  favoriteArtistSongName: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    minHeight: 14,
  },
  hiddenSongsCarouselSection: {
    minHeight: 0,
  },
  hiddenSongsCarouselSectionContent: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 18,
    gap: 8,
  },
  hiddenSongsCarouselHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  hiddenSongsCarouselHeaderLeft: {
    flex: 1,
    maxWidth: 620,
    gap: 6,
  },
  hiddenSongsCarouselHelper: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "left",
    maxWidth: 620,
  },
  hiddenSongsCarouselHelperAction: {
    alignSelf: "flex-start",
    maxWidth: 460,
    marginTop: 6,
  },
  hiddenSongsCarouselHelperActionText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 21,
    textAlign: "right",
    textDecorationLine: "underline",
    flexShrink: 1,
  },
  hiddenSongsCarouselBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 390,
    marginTop: -6,
  },
  hiddenSongsCarouselArrowButton: {
    width: 60,
    height: 60,
    flexShrink: 0,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: colors.shadow,
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  hiddenSongsCarouselArrowButtonCompact: {
    width: 40,
    height: 40,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  hiddenSongsCarouselArrowButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    borderColor: colors.border,
    backgroundColor: colors.backgroundRaised,
  },
  hiddenSongsCarouselArrowButtonInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  hiddenSongsCarouselArrowLeft: {
    transform: [{ translateX: -3 }, { rotate: "90deg" }],
  },
  hiddenSongsCarouselArrowRight: {
    transform: [{ translateX: 3 }, { rotate: "-90deg" }],
  },
  hiddenSongsCarouselTrack: {
    flex: 1,
    position: "relative",
    overflow: "visible",
    minHeight: 390,
    zIndex: 1,
  },
  hiddenSongsCarouselItem: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 300,
    marginLeft: -150,
    marginTop: -165,
    alignItems: "center",
    gap: 8,
  },
  hiddenSongsCarouselCdSlot: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  hiddenSongsCarouselSongTitle: {
    width: "100%",
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 6,
  },
  hiddenSongsCarouselSongArtist: {
    width: "100%",
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 1,
  },
  mainComparisonSection: {
    minHeight: 0,
  },
  mainComparisonColumns: {
    flexDirection: "column",
    gap: 18,
    alignItems: "stretch",
  },
  mainComparisonSectionDivider: {
    width: "100%",
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.92,
  },
  mainComparisonArea: {
    minWidth: 300,
    gap: 12,
  },
  mainComparisonListFrame: {
    height: 540,
    position: "relative",
  },
  mainComparisonScroll: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
          scrollbarWidth: "none",
        } as ViewStyle)
      : null),
  },
  mainComparisonListContent: {
    paddingRight: 28,
    paddingBottom: 10,
    gap: 10,
  },
  songListLoadingRow: {
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  songListLoadingText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 20,
  },
  songListLoadingTextDark: {
    color: colors.border,
  },
  mainComparisonScrollbarTrack: {
    position: "absolute",
    top: 10,
    right: 8,
    bottom: 10,
    width: 14,
    borderRadius: 999,
    backgroundColor: colors.scrollbarTrack,
    cursor: "pointer" as any,
  },
  mainComparisonScrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.scrollbarThumb,
  },
  songRowShell: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  songRowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  songRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.16)",
    minHeight: 98,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
  },
  songRowActive: {
    backgroundColor: "transparent",
  },
  cdCaseFrame: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  cdCaseBackdropWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  cdCaseBackdrop: {
    borderRadius: 4,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cdCaseImage: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  songCopy: {
    flex: 1,
    gap: 3,
  },
  songTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 17,
    lineHeight: 20,
  },
  songTitleDark: {
    color: colors.border,
  },
  songMeta: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 17,
  },
  songMetaDark: {
    color: colors.border,
  },
  songTextActive: {
    color: colors.textLight,
  },
  songTextActiveDark: {
    color: colors.border,
  },
  emptyPaneInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 34,
    lineHeight: 38,
    textAlign: "center",
  },
  emptyText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
