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
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { loadAvailableYears, loadCountryHiddenGemsPreview, loadCountryProfile, loadCountrySongsPage } from "../data/countryApi";
import { hasKnownSongTitle, mapApiCountryProfile, mapApiSong } from "../data/apiMappers";
import { Country, Song } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  country: Country;
  countries: Country[];
  onSelectCountry: (countryId: string) => void;
  onOpenHiddenGems: (selection?: { songTitle?: string; artist?: string }) => void;
  onOpenComparisonMode: () => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

type SongPreview = {
  title: string;
  artist: string;
  detail: string;
  score: number;
};

type ApiSongInput = Parameters<typeof mapApiSong>[0];

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
const carouselOverlap = 62;

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
  valueOffsetY = 0,
  useLoadingStyle = false,
  style,
}: {
  label: string;
  value: ReactNode;
  note: string;
  valueOffsetY?: number;
  useLoadingStyle?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <CountryPageSection style={[styles.statSquare, style]} contentStyle={styles.statSquareContent}>
      <Text style={styles.statSquareLabel}>{label}</Text>
      <Text
        style={[
          styles.statSquareValue,
          useLoadingStyle ? styles.statSquareValueLoading : null,
          valueOffsetY !== 0 ? { transform: [{ translateY: valueOffsetY }] } : null,
        ]}
      >
        {value}
      </Text>
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
              onHoverOut={() => setHoveredSongKey((current) => (current === `${title}-${song.title}-${song.artist}-${index}` ? null : current))}
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
  subtitle: _subtitle,
  items: _items,
  visual: _visual = "bars",
}: {
  title: string;
  subtitle?: string;
  items: BreakdownItem[];
  visual?: "bars" | "pie";
}) {
  return (
    <CountryPageSection style={styles.genreSection} fillVariant="softBlue" contentStyle={styles.insightSectionContent}>
      <View style={styles.genreSectionHeader}>
        <Text style={styles.insightSectionTitle}>{title}</Text>
      </View>
    </CountryPageSection>
  );
}

function LanguageSection({ title, subtitle: _subtitle, items: _items }: { title: string; subtitle?: string; items: BreakdownItem[] }) {
  return (
    <CountryPageSection style={styles.languageSection} fillVariant="softBlue" contentStyle={styles.insightSectionContent}>
      <View style={styles.genreSectionHeader}>
        <Text style={styles.insightSectionTitle}>{title}</Text>
      </View>
    </CountryPageSection>
  );
}

function CountryHeaderDropdownStack({
  countries,
  country,
  selectedYear,
  availableYears,
  onSelectCountry,
  onChangeYear,
}: {
  countries: Country[];
  country: Country;
  selectedYear: number;
  availableYears: number[];
  onSelectCountry: (countryId: string) => void;
  onChangeYear: (year: number) => void;
}) {
  const yearOptions = useMemo(() => [...availableYears], [availableYears]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isCountryDropdownHovered, setIsCountryDropdownHovered] = useState(false);
  const [isYearDropdownHovered, setIsYearDropdownHovered] = useState(false);
  const [isCountryDropdownPressed, setIsCountryDropdownPressed] = useState(false);
  const [isYearDropdownPressed, setIsYearDropdownPressed] = useState(false);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const containerRef = useRef<View>(null);

  const showCountryDropdownGradient =
    isCountryDropdownOpen || isCountryDropdownHovered || isCountryDropdownPressed;
  const showYearDropdownGradient = isYearDropdownOpen || isYearDropdownHovered || isYearDropdownPressed;

  useEffect(() => {
    if (Platform.OS !== "web" || (!isCountryDropdownOpen && !isYearDropdownOpen)) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const node = containerRef.current as any;
      const targetNode = event.target as Node | null;
      const isInside = Boolean(node?.contains?.(targetNode));

      if (!isInside) {
        setIsCountryDropdownOpen(false);
        setIsYearDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [isCountryDropdownOpen, isYearDropdownOpen]);

  return (
    <View ref={containerRef} style={styles.headerDropdownStack}>
      <View style={[styles.headerDropdownWrap, styles.headerCountryDropdownWrap]}>
        <Pressable
          onPress={() => {
            setIsCountryDropdownOpen((current) => !current);
            setIsYearDropdownOpen(false);
          }}
          onHoverIn={() => setIsCountryDropdownHovered(true)}
          onHoverOut={() => setIsCountryDropdownHovered(false)}
          onPressIn={() => setIsCountryDropdownPressed(true)}
          onPressOut={() => setIsCountryDropdownPressed(false)}
          style={styles.headerDropdownShell}
        >
          {showCountryDropdownGradient ? (
            <LinearGradient
              colors={isCountryDropdownPressed ? activeGradient : hoverGradient}
              locations={[0, 0.34, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.headerDropdownButtonGradient}
            />
          ) : null}
          <View style={[styles.headerDropdownButton, showCountryDropdownGradient ? styles.headerDropdownButtonActive : null]}>
            <Text style={styles.headerDropdownText} numberOfLines={1}>
              {country.name}
            </Text>
            <Text style={styles.headerDropdownChevron}>{isCountryDropdownOpen ? "-" : "+"}</Text>
          </View>
        </Pressable>
        {isCountryDropdownOpen ? (
          <Panel style={styles.headerDropdownMenu}>
            <SecondarySurfaceFill />
            <ScrollView style={styles.headerDropdownScroll} contentContainerStyle={styles.headerDropdownContent}>
              <Pressable
                onHoverIn={() => setHoveredCountryId("__select_country__")}
                onHoverOut={() => setHoveredCountryId((current) => (current === "__select_country__" ? null : current))}
                onPress={() => setIsCountryDropdownOpen(false)}
                style={styles.headerDropdownOptionShell}
              >
                {hoveredCountryId === "__select_country__" ? (
                  <LinearGradient
                    colors={hoverGradient}
                    locations={[0, 0.34, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.headerDropdownOptionGradient}
                  />
                ) : null}
                <View
                  style={[
                    styles.headerDropdownOption,
                    hoveredCountryId === "__select_country__" ? styles.headerDropdownOptionActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.headerDropdownOptionText,
                      hoveredCountryId === "__select_country__" ? styles.headerDropdownOptionTextActive : null,
                    ]}
                  >
                    Select Country
                  </Text>
                </View>
              </Pressable>
              {countries.map((countryOption) => {
                const selected = countryOption.id === country.id;
                const hovered = hoveredCountryId === countryOption.id;
                const showOptionGradient = selected || hovered;

                return (
                  <Pressable
                    key={countryOption.id}
                    onHoverIn={() => setHoveredCountryId(countryOption.id)}
                    onHoverOut={() => setHoveredCountryId((current) => (current === countryOption.id ? null : current))}
                    onPress={() => {
                      onSelectCountry(countryOption.id);
                      setIsCountryDropdownOpen(false);
                    }}
                    style={styles.headerDropdownOptionShell}
                  >
                    {showOptionGradient ? (
                      <LinearGradient
                        colors={selected ? activeGradient : hoverGradient}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.headerDropdownOptionGradient}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.headerDropdownOption,
                        showOptionGradient ? styles.headerDropdownOptionActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.headerDropdownOptionText,
                          showOptionGradient ? styles.headerDropdownOptionTextActive : null,
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

      <View style={[styles.headerDropdownWrap, styles.headerBottomYearDropdownWrap]}>
        <Pressable
          onPress={() => {
            setIsYearDropdownOpen((current) => !current);
            setIsCountryDropdownOpen(false);
          }}
          onHoverIn={() => setIsYearDropdownHovered(true)}
          onHoverOut={() => setIsYearDropdownHovered(false)}
          onPressIn={() => setIsYearDropdownPressed(true)}
          onPressOut={() => setIsYearDropdownPressed(false)}
          style={styles.headerDropdownShell}
        >
          {showYearDropdownGradient ? (
            <LinearGradient
              colors={isYearDropdownPressed ? activeGradient : hoverGradient}
              locations={[0, 0.34, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.headerDropdownButtonGradient}
            />
          ) : null}
          <View style={[styles.headerDropdownButton, showYearDropdownGradient ? styles.headerDropdownButtonActive : null]}>
            <Text style={styles.headerDropdownText}>{selectedYear}</Text>
            <Text style={styles.headerDropdownChevron}>{isYearDropdownOpen ? "-" : "+"}</Text>
          </View>
        </Pressable>
        {isYearDropdownOpen ? (
          <Panel style={styles.headerDropdownMenu}>
            <SecondarySurfaceFill />
            <ScrollView style={styles.headerDropdownScroll} contentContainerStyle={styles.headerDropdownContent}>
              <Pressable
                onHoverIn={() => setHoveredYear(0)}
                onHoverOut={() => setHoveredYear((current) => (current === 0 ? null : current))}
                onPress={() => setIsYearDropdownOpen(false)}
                style={styles.headerDropdownOptionShell}
              >
                {hoveredYear === 0 ? (
                  <LinearGradient
                    colors={hoverGradient}
                    locations={[0, 0.34, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.headerDropdownOptionGradient}
                  />
                ) : null}
                <View style={[styles.headerDropdownOption, hoveredYear === 0 ? styles.headerDropdownOptionActive : null]}>
                  <Text
                    style={[styles.headerDropdownOptionText, hoveredYear === 0 ? styles.headerDropdownOptionTextActive : null]}
                  >
                    Select Year
                  </Text>
                </View>
              </Pressable>
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
                    style={styles.headerDropdownOptionShell}
                  >
                    {showOptionGradient ? (
                      <LinearGradient
                        colors={selected ? activeGradient : hoverGradient}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.headerDropdownOptionGradient}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.headerDropdownOption,
                        showOptionGradient ? styles.headerDropdownOptionActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.headerDropdownOptionText,
                          showOptionGradient ? styles.headerDropdownOptionTextActive : null,
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

function HiddenSongsCarouselSection({
  countryName,
  songs,
  isLoading,
  loadingText,
  sectionAvailable,
  onOpenHiddenGems,
  useStackedHeaderText,
}: {
  countryName: string;
  songs: Pick<Song, "title" | "artist">[];
  isLoading: boolean;
  loadingText: string;
  sectionAvailable: boolean;
  onOpenHiddenGems: (selection?: { songTitle?: string; artist?: string }) => void;
  useStackedHeaderText: boolean;
}) {
  const isNativePlatform = Platform.OS !== "web";
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
      <View style={[styles.hiddenSongsCarouselHeader, useStackedHeaderText ? styles.hiddenSongsCarouselHeaderStacked : null]}>
        <View style={[styles.hiddenSongsCarouselHeaderLeft, useStackedHeaderText ? styles.hiddenSongsCarouselHeaderLeftStacked : null]}>
          <Text style={styles.panelTitle}>Preview {countryName}'s Hidden Gems</Text>
          <Text style={styles.hiddenSongsCarouselHelper}>
            {isLoading
              ? loadingText
              : sectionAvailable
                ? "Click a song to listen to a 30 second preview on the Hidden Gems page."
                : ""}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (sectionAvailable) {
              onOpenHiddenGems();
            }
          }}
          style={[
            styles.hiddenSongsCarouselHelperAction,
            useStackedHeaderText ? styles.hiddenSongsCarouselHelperActionStacked : null,
            !sectionAvailable ? styles.hiddenSongsCarouselHelperActionDisabled : null,
          ]}
        >
          <Text style={styles.hiddenSongsCarouselHelperActionText}>{`Click here to view all of ${countryName}'s hidden gems`}</Text>
        </Pressable>
      </View>
      {!isLoading && !sectionAvailable ? (
        <View style={styles.sectionFallbackBody}>
          <Text style={styles.sectionFallbackText}>
            Unfortunately at this time, there is not enough data needed for this country in this year to display this section. Try another year and/or country to utilize Hidden Gems.
          </Text>
        </View>
      ) : (
        <View style={[styles.hiddenSongsCarouselBody, isNativePlatform ? styles.hiddenSongsCarouselBodyNative : null]}>
          {isNativePlatform ? (
            <Pressable
              onPress={goPrevious}
              style={[
                styles.hiddenSongsCarouselArrowButton,
                styles.hiddenSongsCarouselArrowLowered,
                styles.hiddenSongsCarouselArrowLoweredNative,
              ]}
            >
              <View style={styles.hiddenSongsCarouselArrowButtonInner}>
                <GemIcon size={38} style={styles.hiddenSongsCarouselArrowLeft} />
              </View>
            </Pressable>
          ) : null}
          <View style={[styles.hiddenSongsCarouselTrack, isNativePlatform ? styles.hiddenSongsCarouselTrackNative : null]}>
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
                      <Text
                        style={[
                          styles.hiddenSongsCarouselSongTitle,
                          isNativePlatform ? styles.hiddenSongsCarouselSongTitleNative : null,
                        ]}
                      >
                        {song.title}
                      </Text>
                      <Text
                        style={[
                          styles.hiddenSongsCarouselSongArtist,
                          isNativePlatform ? styles.hiddenSongsCarouselSongArtistNative : null,
                        ]}
                      >
                        {song.artist}
                      </Text>
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          {isNativePlatform ? (
            <Pressable
              onPress={goNext}
              style={[
                styles.hiddenSongsCarouselArrowButton,
                styles.hiddenSongsCarouselArrowLowered,
                styles.hiddenSongsCarouselArrowLoweredNative,
              ]}
            >
              <View style={styles.hiddenSongsCarouselArrowButtonInner}>
                <GemIcon size={38} style={styles.hiddenSongsCarouselArrowRight} />
              </View>
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={goPrevious}
                style={[styles.hiddenSongsCarouselArrowButton, styles.hiddenSongsCarouselArrowButtonLeft]}
              >
                <View style={styles.hiddenSongsCarouselArrowButtonInner}>
                  <GemIcon size={38} style={styles.hiddenSongsCarouselArrowLeft} />
                </View>
              </Pressable>
              <Pressable
                onPress={goNext}
                style={[styles.hiddenSongsCarouselArrowButton, styles.hiddenSongsCarouselArrowButtonRight]}
              >
                <View style={styles.hiddenSongsCarouselArrowButtonInner}>
                  <GemIcon size={38} style={styles.hiddenSongsCarouselArrowRight} />
                </View>
              </Pressable>
            </>
          )}
        </View>
      )}
    </CountryPageSection>
  );
}

function FavoriteArtistsSection({
  country,
  selectedYear,
  artists,
  isLoading,
  onOpenHiddenGems,
  sectionAvailable,
}: {
  country: Country;
  selectedYear: number;
  artists: string[];
  isLoading: boolean;
  sectionAvailable: boolean;
  onOpenHiddenGems: (selection?: { songTitle?: string; artist?: string }) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const [isDraggingArtistScrollbar, setIsDraggingArtistScrollbar] = useState(false);
  const trackRef = useRef<View>(null);
  const artistRows = Array.from({ length: 8 }, (_, index) => artists[index] ?? "");
  const showArtistScrollbar = Platform.OS === "web" && viewportWidth > 0;
  const artistOverflow = showArtistScrollbar && contentWidth > viewportWidth;
  const artistTrackWidth = Math.max(viewportWidth, 1);
  const artistThumbWidth = artistOverflow
    ? Math.max((viewportWidth / contentWidth) * viewportWidth, 52)
    : artistTrackWidth;
  const artistThumbLeft =
    artistOverflow && contentWidth > viewportWidth
      ? (scrollX / (contentWidth - viewportWidth)) * (viewportWidth - artistThumbWidth)
      : 0;

  const scrollArtistsToTrackLocation = (locationX: number) => {
    if (!artistOverflow || contentWidth <= viewportWidth) {
      return;
    }

    const nextThumbLeft = Math.min(Math.max(locationX - artistThumbWidth / 2, 0), artistTrackWidth - artistThumbWidth);
    const nextRatio = nextThumbLeft / (artistTrackWidth - artistThumbWidth);
    const nextScrollX = nextRatio * (contentWidth - viewportWidth);
    scrollRef.current?.scrollTo({ x: nextScrollX, animated: false });
    setScrollX(nextScrollX);
  };

  const scrollArtistsToClientX = (clientX: number) => {
    const rect = (trackRef.current as any)?.getBoundingClientRect?.();
    if (!rect) {
      return;
    }
    scrollArtistsToTrackLocation(clientX - rect.left);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || !isDraggingArtistScrollbar || typeof document === "undefined") {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;

    const handleMove = (event: MouseEvent) => {
      event.preventDefault();
      scrollArtistsToClientX(event.clientX);
    };

    const handleUp = () => {
      setIsDraggingArtistScrollbar(false);
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [artistOverflow, artistThumbWidth, artistTrackWidth, contentWidth, viewportWidth, isDraggingArtistScrollbar]);

  return (
    <CountryPageSection style={styles.snapshotPanel}>
      <Text style={styles.panelTitle}>{`${country.name}'s Favorite Artists in ${selectedYear}`}</Text>
      {!isLoading && !sectionAvailable ? (
        <View style={styles.sectionFallbackBody}>
          <Text style={styles.sectionFallbackText}>
            Unfortunately at this time, there is not enough data needed for this country in this year to display this section. Try another year and/or country to utilize Featured Artists.
          </Text>
        </View>
      ) : (
        <View style={styles.favoriteArtistsScrollFrame}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.favoriteArtistsScroll}
            contentContainerStyle={styles.favoriteArtistsRow}
            onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
            onContentSizeChange={(width) => setContentWidth(width)}
            onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => setScrollX(event.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
          >
            {artistRows.map((artist, index) => (
              <Pressable
                key={`${artist}-${index}`}
                onPress={() => {
                  if (!isLoading && artist) {
                    onOpenHiddenGems({ artist });
                  }
                }}
                style={styles.favoriteArtistItem}
              >
                <CdCase size={104} artColor={carouselBackdropColors[index % carouselBackdropColors.length]} />
                <Text style={styles.favoriteArtistName}>{isLoading ? "Loading..." : artist}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {showArtistScrollbar ? (
            <View
              ref={trackRef}
              style={styles.favoriteArtistsScrollbarTrack}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(event) => scrollArtistsToTrackLocation(event.nativeEvent.locationX)}
              onResponderMove={(event) => scrollArtistsToTrackLocation(event.nativeEvent.locationX)}
              {...(Platform.OS === "web"
                ? ({
                    onMouseDown: (event: any) => {
                      event.preventDefault();
                      setIsDraggingArtistScrollbar(true);
                      scrollArtistsToClientX(event.clientX);
                    },
                  } as any)
                : {})}
            >
              <View
                style={[
                  styles.favoriteArtistsScrollbarThumb,
                  { width: artistThumbWidth, transform: [{ translateX: artistThumbLeft }] },
                ]}
              />
            </View>
          ) : null}
        </View>
      )}
    </CountryPageSection>
  );
}

function ComparisonModeFooter({ onPress, isCompact }: { onPress: () => void; isCompact: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const showGradient = isHovered || isPressed;

  return (
    <View style={styles.comparisonModeFooter}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={styles.comparisonModeFooterShell}
      >
        <LinearGradient
          colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.42)", "rgba(66,72,101,0.72)"]}
          locations={[0, 0.42, 0.78, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.comparisonModeFooterBaseFill}
        />
        {showGradient ? (
          <LinearGradient
            colors={isPressed ? activeGradient : hoverGradient}
            locations={[0, 0.34, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.comparisonModeFooterGradient}
          />
        ) : null}
        <View style={[styles.comparisonModeFooterInner, isCompact ? styles.comparisonModeFooterInnerCompact : null, showGradient ? styles.comparisonModeFooterInnerActive : null]}>
          <Text style={[styles.comparisonModeFooterText, showGradient ? styles.comparisonModeFooterTextActive : null]}>
            <Text style={[styles.comparisonModeFooterLead, isCompact ? styles.comparisonModeFooterLeadCompact : null]}>To compare two countries</Text>
            <Text style={[styles.comparisonModeFooterBody, isCompact ? styles.comparisonModeFooterBodyCompact : null]}>,  click here to utilize Comparison Mode.</Text>
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export function CountryScreen({
  country,
  countries,
  onSelectCountry,
  onOpenHiddenGems,
  onOpenComparisonMode,
  selectedYear,
  onChangeYear,
}: Props) {
  const { width } = useWindowDimensions();
  const isStacked = width < 1120;
  const isCompact = width < 760;
  const splitStatsAndInsights = width < 1280;
  const statsTwoByTwo = width < 980;
  const stackHiddenGemsHeaderText = width < 1120;
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
  const pageScrollRef = useRef<ScrollView>(null);
  const pageTrackRef = useRef<View>(null);
  const [pageViewportHeight, setPageViewportHeight] = useState(0);
  const [pageContentHeight, setPageContentHeight] = useState(0);
  const [pageScrollY, setPageScrollY] = useState(0);
  const [isDraggingPageScrollbar, setIsDraggingPageScrollbar] = useState(false);
  const pageScrollbarVisible = Platform.OS === "web" && pageViewportHeight > 0;
  const pageHasOverflow = pageScrollbarVisible && pageContentHeight > pageViewportHeight;
  const pageTrackHeight = Math.max(pageViewportHeight - 24, 1);
  const pageThumbHeight = pageScrollbarVisible
    ? pageHasOverflow
      ? Math.max((pageViewportHeight / pageContentHeight) * pageViewportHeight, 60)
      : pageTrackHeight
    : 0;
  const pageThumbTop = pageHasOverflow ? (pageScrollY / (pageContentHeight - pageViewportHeight)) * (pageViewportHeight - pageThumbHeight) : 0;
  const latestRequestRef = useRef(0);

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
          console.warn("Failed to load available years metadata. Falling back to current year selection.", error);
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

        console.warn(`Failed to load country profile API data for ${country.code} ${selectedYear}.`, error);
        setApiProfile(null);
        setInitialLoadingProfile(false);
      });

    loadCountryHiddenGemsPreview(country.code, selectedYear, 13)
      .then((hiddenGemsPayload) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }

        setPreviewSongs(
          hiddenGemsPayload
            .map((item) => ({
              title: item.songName?.trim() ? item.songName : "Unknown Song",
              artist: item.artistName?.trim() ? item.artistName : "Unknown Artist",
            }))
            .filter((song) => hasKnownSongTitle(song.title))
        );
        setInitialLoadingPreview(false);
      })
      .catch((error) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }

        console.warn(`Failed to load hidden gems preview API data for ${country.code} ${selectedYear}.`, error);
        setPreviewSongs([]);
        setInitialLoadingPreview(false);
      });

    loadCountrySongsPage(country.code, selectedYear, "unique", 1, 50)
      .then((payload) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }

        setUniqueSongs(
          payload.items
            .map((song: ApiSongInput, index: number) => {
              const mappedSong = mapApiSong(song);
              if (!hasKnownSongTitle(mappedSong.title)) {
                return null;
              }
              return toSongPreview(mappedSong, `Feels especially loved in ${country.name}`, clamp(95 - index * 2, 34, 95));
            })
            .filter((song: SongPreview | null): song is SongPreview => song != null)
        );
        setUniqueHasMore(payload.hasMore);
        setInitialLoadingUnique(false);
      })
      .catch((error) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }

        console.warn(`Failed to load unique songs page for ${country.code} ${selectedYear}.`, error);
        setUniqueSongs([]);
        setInitialLoadingUnique(false);
      });

    loadCountrySongsPage(country.code, selectedYear, "shared", 1, 50)
      .then((payload) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }

        setSharedSongs(
          payload.items
            .map((song: ApiSongInput, index: number) => {
              const mappedSong = mapApiSong(song);
              if (!hasKnownSongTitle(mappedSong.title)) {
                return null;
              }
              return toSongPreview(
                mappedSong,
                "Loved in this country and echoed across other countries",
                clamp(95 - index * 2, 34, 95)
              );
            })
            .filter((song: SongPreview | null): song is SongPreview => song != null)
        );
        setSharedHasMore(payload.hasMore);
        setInitialLoadingShared(false);
      })
      .catch((error) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }

        console.warn(`Failed to load shared songs page for ${country.code} ${selectedYear}.`, error);
        setSharedSongs([]);
        setInitialLoadingShared(false);
      });
  }, [country.code, selectedYear]);

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
          const nextItems = payload.items
            .map((song: ApiSongInput, index: number) => {
              const mappedSong = mapApiSong(song);
              if (!hasKnownSongTitle(mappedSong.title)) {
                return null;
              }
              return toSongPreview(
                mappedSong,
                `Feels especially loved in ${country.name}`,
                clamp(95 - (current.length + index) * 2, 34, 95)
              );
            })
            .filter((song: SongPreview | null): song is SongPreview => song != null);
          return [...current, ...nextItems];
        });
        setUniquePage(nextPage);
        setUniqueHasMore(payload.hasMore);
      })
      .catch((error) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        console.warn(`Failed loading additional unique songs for ${country.code} ${selectedYear}.`, error);
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
          const nextItems = payload.items
            .map((song: ApiSongInput, index: number) => {
              const mappedSong = mapApiSong(song);
              if (!hasKnownSongTitle(mappedSong.title)) {
                return null;
              }
              return toSongPreview(
                mappedSong,
                "Loved in this country and echoed across other countries",
                clamp(95 - (current.length + index) * 2, 34, 95)
              );
            })
            .filter((song: SongPreview | null): song is SongPreview => song != null);
          return [...current, ...nextItems];
        });
        setSharedPage(nextPage);
        setSharedHasMore(payload.hasMore);
      })
      .catch((error) => {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        console.warn(`Failed loading additional shared songs for ${country.code} ${selectedYear}.`, error);
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

    const selectedArtists: string[] = [];
    const seen = new Set<string>();
    const addArtist = (name: string) => {
      const normalized = name.trim().toLowerCase();
      if (!normalized || seen.has(normalized) || selectedArtists.length >= 8) {
        return;
      }

      seen.add(normalized);
      selectedArtists.push(name);
    };

    apiProfile.topUniqueSongs.forEach((song) => addArtist(song.artist));
    if (selectedArtists.length < 8) {
      apiProfile.topSharedSongs.forEach((song) => addArtist(song.artist));
    }

    return selectedArtists;
  }, [apiProfile]);

  const hiddenGemSongs = useMemo(() => {
    return previewSongs;
  }, [previewSongs]);
  const hasFeaturedArtistsSectionData = favoriteArtists.length > 0;
  const hasHiddenGemsSectionData = hiddenGemSongs.length > 0;

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
    const artistA = favoriteArtists[0];
    const artistB = favoriteArtists[1];
    const songA = profileStats.uniqueSongs[0] ?? profileStats.sharedSongs[0];
    const songB = profileStats.uniqueSongs[1] ?? profileStats.sharedSongs[1] ?? profileStats.sharedSongs[0];

    if (!artistA || !artistB || !songA || !songB) {
      return `A mix of ${genreA}, ${genreB}, and ${genreC} are ${country.name}'s favorites in ${selectedYear}. Favorite artists include ${loadingText} and ${loadingText}, and favorite songs that year included ${loadingText} and ${loadingText}.`;
    }

    return `A mix of ${genreA}, ${genreB}, and ${genreC} are ${country.name}'s favorites in ${selectedYear}. Favorite artists include ${artistA} and ${artistB}, and favorite songs that year included ${songA.title} by ${songA.artist} and ${songB.title} by ${songB.artist}.`;
  }, [country.genres, country.name, favoriteArtists, loadingText, profileStats.sharedSongs, profileStats.uniqueSongs, selectedYear]);

  const handlePageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPageScrollY(event.nativeEvent.contentOffset.y);
  };

  const scrollPageToTrackLocation = (locationY: number) => {
    if (!pageHasOverflow || pageContentHeight <= pageViewportHeight) {
      return;
    }

    const nextThumbTop = Math.min(Math.max(locationY - pageThumbHeight / 2, 0), pageTrackHeight - pageThumbHeight);
    const nextRatio = nextThumbTop / (pageTrackHeight - pageThumbHeight);
    const nextScrollY = nextRatio * (pageContentHeight - pageViewportHeight);
    pageScrollRef.current?.scrollTo({ y: nextScrollY, animated: false });
    setPageScrollY(nextScrollY);
  };

  const scrollPageToClientY = (clientY: number) => {
    const rect = (pageTrackRef.current as any)?.getBoundingClientRect?.();
    if (!rect) {
      return;
    }

    scrollPageToTrackLocation(clientY - rect.top);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || !isDraggingPageScrollbar || typeof document === "undefined") {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;

    const handleMove = (event: MouseEvent) => {
      event.preventDefault();
      scrollPageToClientY(event.clientY);
    };

    const handleUp = () => {
      setIsDraggingPageScrollbar(false);
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingPageScrollbar, pageHasOverflow, pageThumbHeight, pageTrackHeight, pageContentHeight, pageViewportHeight]);

  return (
    <ScreenScaffold>
      <View style={styles.pageScrollFrame}>
      <ScrollView
        ref={pageScrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onLayout={(event) => setPageViewportHeight(event.nativeEvent.layout.height)}
        onContentSizeChange={(_, height) => setPageContentHeight(height)}
        onScroll={handlePageScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.topSection, isCompact ? styles.topSectionStacked : null]}>
          <View style={styles.topSectionCountryBlock}>
            <View style={styles.headerCopy}>
              <Text style={styles.pageTitle}>{country.name}</Text>
              <Text style={styles.pageSubtitle}>{country.region}</Text>
            </View>
          </View>
          <View style={styles.topSectionYearBlock}>
            <CountryHeaderDropdownStack
              countries={countries}
              country={country}
              selectedYear={selectedYear}
              availableYears={yearOptions}
              onSelectCountry={onSelectCountry}
              onChangeYear={onChangeYear}
            />
          </View>
        </View>

        <CountryPageSection style={styles.countrySummarySection} fillVariant="comparisonBlue">
          <Text style={[styles.countrySummarySectionHeader, styles.countrySummarySectionTextDark]}>Country Summary</Text>

          <View style={[styles.countrySummarySectionDetailsRow, isCompact ? styles.stackRow : null]}>
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
          sectionAvailable={hasFeaturedArtistsSectionData}
          onOpenHiddenGems={onOpenHiddenGems}
        />

        <View style={[styles.statSquaresAndGenreSectionRow, splitStatsAndInsights ? styles.stackRow : null]}>
          <View style={[styles.statSquaresBlock, !splitStatsAndInsights ? styles.statSquaresBlockWide : null]}>
            <View style={[styles.statSquaresGrid, statsTwoByTwo ? styles.statSquaresGridTwoByTwo : styles.statSquaresGridSingleRow]}>
              <StatSquare
                label="Songs in This View"
                value={isCoreLoading ? loadingText : `${profileStats.totalCharted}`}
                note="songs"
                valueOffsetY={6}
                useLoadingStyle={isCoreLoading}
                style={splitStatsAndInsights && !statsTwoByTwo ? styles.statSquareWide : statsTwoByTwo ? styles.statSquareHalf : null}
              />
              <StatSquare
                label="Loved in This Country"
                value={isCoreLoading ? loadingText : `${profileStats.uniqueCount}`}
                note="songs"
                valueOffsetY={6}
                useLoadingStyle={isCoreLoading}
                style={splitStatsAndInsights && !statsTwoByTwo ? styles.statSquareWide : statsTwoByTwo ? styles.statSquareHalf : null}
              />
              <StatSquare
                label="Loved Here and Elsewhere"
                value={isCoreLoading ? loadingText : `${profileStats.sharedCount}`}
                note="songs"
                useLoadingStyle={isCoreLoading}
                style={splitStatsAndInsights && !statsTwoByTwo ? styles.statSquareWide : statsTwoByTwo ? styles.statSquareHalf : null}
              />
              <StatSquare
                label="Loved Here and Elsewhere"
                value={isCoreLoading ? (
                  loadingText
                ) : (
                  <>
                    {profileStats.overlapPercent}
                    <Text style={styles.statSquareValuePercentSymbol}>%</Text>
                  </>
                )}
                note="% of this view"
                useLoadingStyle={isCoreLoading}
                style={splitStatsAndInsights && !statsTwoByTwo ? styles.statSquareWide : statsTwoByTwo ? styles.statSquareHalf : null}
              />
            </View>
          </View>
          <View
            style={[
              styles.genreAndLanguageSections,
              !splitStatsAndInsights ? styles.genreAndLanguageSectionsWide : null,
              statsTwoByTwo ? styles.stackRow : null,
            ]}
          >
            <GenreSection
              title={`${country.name}'s Loved Genres`}
              subtitle="Genres most loved in this country view"
              items={profileStats.genreBreakdown}
              visual="pie"
            />
            <LanguageSection
              title={`${country.name}'s Language(s) in Music`}
              subtitle="Languages most represented in this country view"
              items={profileStats.languageBreakdown}
            />
          </View>
        </View>

        <HiddenSongsCarouselSection
          countryName={country.name}
          songs={hiddenGemSongs.length > 0 ? hiddenGemSongs : [{ title: loadingText, artist: loadingText }]}
          isLoading={initialLoadingPreview}
          loadingText={loadingText}
          sectionAvailable={hasHiddenGemsSectionData}
          useStackedHeaderText={stackHiddenGemsHeaderText}
          onOpenHiddenGems={(selection) => {
            if (hasHiddenGemsSectionData) {
              onOpenHiddenGems(selection);
            }
          }}
        />

        <CountryPageSection style={styles.mainComparisonSection} fillVariant="comparisonBlue">
          <View style={[styles.mainComparisonColumns, isStacked ? styles.stackRow : null]}>
            <MainComparisonArea
              title="Most Loved in This Country"
              songs={profileStats.uniqueSongs}
              onOpenHiddenGems={onOpenHiddenGems}
              isInitialLoading={initialLoadingUnique}
              hasMore={uniqueHasMore}
              isLoadingMore={loadingMoreUnique}
              onLoadMore={loadMoreUniqueSongs}
              darkTheme
            />
            <View style={[styles.mainComparisonDivider, isStacked ? styles.mainComparisonDividerStacked : null]} />
            <MainComparisonArea
              title="Loved Here and Elsewhere"
              songs={profileStats.sharedSongs}
              onOpenHiddenGems={onOpenHiddenGems}
              isInitialLoading={initialLoadingShared}
              hasMore={sharedHasMore}
              isLoadingMore={loadingMoreShared}
              onLoadMore={loadMoreSharedSongs}
              darkTheme
            />
          </View>
        </CountryPageSection>

        <ComparisonModeFooter onPress={onOpenComparisonMode} isCompact={isCompact} />
      </ScrollView>
      {pageScrollbarVisible ? (
        <View
          ref={pageTrackRef}
          style={styles.pageScrollbarTrack}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => scrollPageToTrackLocation(event.nativeEvent.locationY)}
          onResponderMove={(event) => scrollPageToTrackLocation(event.nativeEvent.locationY)}
          {...(Platform.OS === "web"
            ? ({
                onMouseDown: (event: any) => {
                  event.preventDefault();
                  setIsDraggingPageScrollbar(true);
                  scrollPageToClientY(event.clientY);
                },
              } as any)
            : {})}
        >
          <View style={[styles.pageScrollbarThumb, { height: pageThumbHeight, transform: [{ translateY: pageThumbTop }] }]} />
        </View>
      ) : null}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  pageScrollFrame: {
    flex: 1,
    position: "relative",
    marginTop: -4,
    marginBottom: -20,
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
          overflowX: "visible",
          scrollbarWidth: "none",
        } as ViewStyle)
      : null),
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 24,
    paddingRight: 18,
    overflow: "visible",
  },
  pageScrollbarTrack: {
    position: "absolute",
    top: 12,
    right: 2,
    bottom: 12,
    width: 14,
    borderRadius: 999,
    backgroundColor: colors.scrollbarTrack,
    cursor: "pointer" as any,
  },
  pageScrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.scrollbarThumb,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
    position: "relative",
    zIndex: 40,
    overflow: "visible",
  },
  topSectionStacked: {
    alignItems: "flex-start",
  },
  topSectionCountryBlock: {
    alignSelf: "flex-start",
    zIndex: 41,
  },
  headerCopy: {
    gap: 2,
    justifyContent: "flex-start",
  },
  topSectionYearBlock: {
    alignSelf: "flex-start",
    paddingTop: 0,
    zIndex: 45,
  },
  headerDropdownStack: {
    width: 156,
    gap: 8,
    position: "relative",
    zIndex: 100,
    overflow: "visible",
  },
  headerDropdownWrap: {
    width: 156,
    position: "relative",
    zIndex: 10,
    alignItems: "stretch",
    justifyContent: "center",
  },
  headerCountryDropdownWrap: {
    zIndex: 14,
  },
  headerBottomYearDropdownWrap: {
    zIndex: 11,
  },
  headerDropdownShell: {
    borderRadius: 17,
    overflow: "hidden",
  },
  headerDropdownButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerDropdownButton: {
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
  headerDropdownButtonActive: {
    backgroundColor: "transparent",
  },
  headerDropdownText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    lineHeight: 18,
    flexShrink: 1,
  },
  headerDropdownChevron: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 28,
    lineHeight: 28,
  },
  headerDropdownMenu: {
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
  headerDropdownScroll: {
    maxHeight: 260,
  },
  headerDropdownContent: {
    padding: 8,
    gap: 8,
  },
  headerDropdownOptionShell: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  headerDropdownOptionGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerDropdownOption: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
  },
  headerDropdownOptionActive: {
    backgroundColor: "transparent",
  },
  headerDropdownOptionText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
  },
  headerDropdownOptionTextActive: {
    color: colors.textLight,
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
  countrySummarySectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
  },
  countrySummarySectionHeaderRowStacked: {
    flexDirection: "column",
    gap: 8,
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
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  countrySummarySectionDetailCard: {
    flex: 1,
    minWidth: 260,
    gap: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.12)",
    padding: 14,
    alignSelf: "flex-start",
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
  statSquaresGrid: {
    width: "100%",
    flexDirection: "row",
    gap: 16,
  },
  statSquaresGridSingleRow: {
    flexWrap: "nowrap",
    justifyContent: "space-between",
  },
  statSquaresGridTwoByTwo: {
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statSquaresAndGenreSectionRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
    width: "100%",
  },
  statSquaresBlock: {
    width: "100%",
    flexShrink: 1,
  },
  statSquaresBlockWide: {
    width: 688,
    maxWidth: 688,
    flexShrink: 0,
  },
  genreAndLanguageSections: {
    width: "100%",
    minWidth: 320,
    flexDirection: "row",
    gap: 16,
    alignItems: "stretch",
  },
  genreAndLanguageSectionsWide: {
    flex: 1,
    minWidth: 0,
  },
  statSquare: {
    width: 156,
    height: 152,
    borderWidth: 2,
    borderColor: "rgba(117, 82, 107, 0.42)",
    shadowColor: colors.accent,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  statSquareWide: {
    flex: 1,
    minWidth: 0,
    width: "auto",
    height: 136,
  },
  statSquareHalf: {
    width: "47%",
    maxWidth: "47%",
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
  },
  statSquareContent: {
    height: "100%",
    padding: 14,
    gap: 8,
    justifyContent: "space-between",
  },
  insightSectionContent: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    gap: 10,
    justifyContent: "space-between",
  },
  statSquareLabel: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
  },
  statSquareValue: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 42,
    lineHeight: 46,
  },
  statSquareValueLoading: {
    fontSize: 22,
    lineHeight: 26,
  },
  statSquareValuePercentSymbol: {
    fontSize: 19,
    lineHeight: 22,
  },
  statSquareNote: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  mainComparisonSection: {
    minHeight: 0,
  },
  mainComparisonColumns: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
  },
  mainComparisonDivider: {
    width: 3,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.92,
    marginVertical: 12,
  },
  mainComparisonDividerStacked: {
    width: "100%",
    height: 3,
    marginVertical: 2,
  },
  mainComparisonArea: {
    flex: 1,
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
  panelEyebrow: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
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
  songListLoadingRow: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  songListLoadingText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 17,
  },
  songListLoadingTextDark: {
    color: colors.border,
  },
  genreSection: {
    flex: 1,
    minWidth: 0,
    height: 152,
    maxHeight: 152,
    borderWidth: 2,
    borderColor: "rgba(117, 82, 107, 0.42)",
  },
  languageSection: {
    flex: 1,
    minWidth: 0,
    height: 152,
    maxHeight: 152,
    borderWidth: 2,
    borderColor: "rgba(117, 82, 107, 0.42)",
  },
  genreSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  genreSectionSubtitle: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
    textAlign: "right",
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
  snapshotCopy: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 25,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 4,
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
  hiddenSongsCarouselHeaderStacked: {
    flexDirection: "column",
    gap: 8,
  },
  hiddenSongsCarouselHeaderLeftStacked: {
    maxWidth: "100%",
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
  hiddenSongsCarouselHelperActionStacked: {
    maxWidth: "100%",
    marginTop: 0,
  },
  hiddenSongsCarouselHelperActionDisabled: {
    opacity: 0.5,
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
    position: "relative",
    alignItems: "stretch",
    justifyContent: "center",
    minHeight: 390,
    marginTop: -6,
    marginHorizontal: -18,
  },
  hiddenSongsCarouselBodyNative: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginHorizontal: 0,
    minHeight: 510,
  },
  sectionFallbackBody: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  sectionFallbackText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 720,
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
    width: 30,
    height: 30,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  hiddenSongsCarouselArrowButtonLeft: {
    position: "absolute",
    left: 18,
    top: "50%",
    marginTop: 42,
  },
  hiddenSongsCarouselArrowButtonLeftCompact: {
    left: 10,
    marginTop: 56,
  },
  hiddenSongsCarouselArrowButtonRight: {
    position: "absolute",
    right: 18,
    top: "50%",
    marginTop: 42,
  },
  hiddenSongsCarouselArrowButtonRightCompact: {
    right: 10,
    marginTop: 56,
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
  hiddenSongsCarouselArrowLowered: {
    marginTop: 236,
  },
  hiddenSongsCarouselArrowLoweredNative: {
    marginTop: 292,
  },
  hiddenSongsCarouselTrack: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    minHeight: 390,
    marginHorizontal: 0,
    zIndex: 1,
  },
  hiddenSongsCarouselTrackNative: {
    flex: 1,
    width: undefined,
    overflow: "visible",
    minHeight: 510,
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
  hiddenSongsCarouselSongTitleNative: {
    width: 220,
    maxWidth: 220,
    marginTop: 26,
    lineHeight: 20,
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
  hiddenSongsCarouselSongArtistNative: {
    width: 220,
    maxWidth: 220,
    marginTop: 8,
  },
  comparisonModeFooter: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 12,
  },
  comparisonModeFooterShell: {
    alignSelf: "center",
    borderRadius: 18,
    overflow: "hidden",
    width: "100%",
    maxWidth: 980,
  },
  comparisonModeFooterGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  comparisonModeFooterBaseFill: {
    ...StyleSheet.absoluteFillObject,
  },
  comparisonModeFooterInner: {
    width: "100%",
    minWidth: 0,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  comparisonModeFooterInnerCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  comparisonModeFooterInnerActive: {
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  comparisonModeFooterText: {
    color: colors.textLight,
    textAlign: "center",
  },
  comparisonModeFooterTextActive: {
    color: colors.textLight,
  },
  comparisonModeFooterLead: {
    fontFamily: typefaces.display,
    fontSize: 23,
    lineHeight: 28,
  },
  comparisonModeFooterLeadCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  comparisonModeFooterBody: {
    fontFamily: typefaces.body,
    fontSize: 19,
    lineHeight: 24,
  },
  comparisonModeFooterBodyCompact: {
    fontSize: 16,
    lineHeight: 21,
  },
  favoriteArtistsRow: {
    flexDirection: "row",
    paddingTop: 0,
    paddingBottom: 10,
    gap: 10,
    flexWrap: "nowrap",
    alignItems: "flex-start",
    paddingHorizontal: 6,
    minWidth: "100%",
    justifyContent: "space-between",
  },
  favoriteArtistsScroll: {
    width: "100%",
    borderRadius: 16,
    ...(Platform.OS === "web"
      ? ({
          overflowX: "scroll",
          scrollbarWidth: "thin",
        } as ViewStyle)
      : null),
  },
  favoriteArtistsScrollFrame: {
    width: "100%",
    gap: 6,
  },
  favoriteArtistsScrollbarTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(108,118,143,0.45)",
    overflow: "hidden",
  },
  favoriteArtistsScrollbarThumb: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(117,82,107,0.58)",
  },
  favoriteArtistsFallbackText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  favoriteArtistItem: {
    alignItems: "center",
    gap: 10,
    width: 118,
    flexShrink: 0,
    transform: [{ translateY: -6 }],
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
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    minHeight: 16,
  },
  stackRow: {
    flexDirection: "column",
  },
});
