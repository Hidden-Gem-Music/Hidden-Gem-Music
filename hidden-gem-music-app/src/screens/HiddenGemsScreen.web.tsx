import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

import { Country, Song } from "../types/content";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { loadCountryProfile, loadHiddenGemsPage } from "../data/countryApi";
import { mapApiCountryProfile, mapApiHiddenGemPage } from "../data/apiMappers";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  country: Country;
  countries: Country[];
  availableYears: number[];
  onSelectCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
  onSetLoading?: (loading: boolean) => void;
  showNavIntro?: boolean;
  onDismissNavIntro?: () => void;
};

const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const controlButtonGradient = [colors.backgroundRaised, colors.backgroundRaised, colors.navGradient] as const;
const cdCaseSource = require("../assets/images/CD-Case-Transparent-Image.png");
const rowBackdropColors = ["#B86A72", "#8B9BC0", "#8B5E7A", "#627F8A", "#C28C5E", "#7A7EB0"];

function useCustomScrollbar() {
  const scrollRef = useRef<ScrollView>(null);
  const trackRef = useRef<View>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const scrollbarVisible = Platform.OS === "web" && viewportHeight > 0;
  const hasOverflow = scrollbarVisible && contentHeight > viewportHeight;
  const trackHeight = Math.max(viewportHeight - 20, 1);
  const thumbHeight = scrollbarVisible
    ? hasOverflow
      ? Math.max((viewportHeight / contentHeight) * viewportHeight, 52)
      : trackHeight
    : 0;
  const thumbTop = hasOverflow ? (scrollY / (contentHeight - viewportHeight)) * (viewportHeight - thumbHeight) : 0;

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
  }, [contentHeight, hasOverflow, isDraggingScrollbar, thumbHeight, trackHeight, viewportHeight]);

  return {
    scrollRef,
    trackRef,
    scrollbarVisible,
    thumbHeight,
    thumbTop,
    setViewportHeight,
    setContentHeight,
    setScrollY,
    scrollToTrackLocation,
    scrollToClientY,
    setIsDraggingScrollbar,
  };
}

function MiniCdCase({
  color,
  showPlayButton,
}: {
  color: string;
  showPlayButton: boolean;
}) {
  return (
    <View style={styles.miniCdCaseFrame}>
      <View style={styles.miniCdCaseBackdropWrap}>
        <View style={[styles.miniCdCaseBackdrop, { backgroundColor: color }]} />
      </View>
      <Image source={cdCaseSource} style={styles.miniCdCaseImage} resizeMode="contain" />
      {showPlayButton ? (
        <View style={styles.miniCdPlayOverlay}>
          <LinearGradient
            colors={controlButtonGradient}
            locations={[0, 0.34, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.miniCdPlayOverlayFill}
          />
          <Text style={styles.miniCdPlayIcon}>▶</Text>
        </View>
      ) : null}
    </View>
  );
}

function BlankCdCase() {
  return (
    <View style={styles.blankCdCaseFrame}>
      <View style={styles.blankCdCaseBackdropWrap}>
        <View style={styles.blankCdCaseBackdrop} />
      </View>
      <Image source={cdCaseSource} style={styles.blankCdCaseImage} resizeMode="contain" />
    </View>
  );
}

function CdCase({ size, artColor }: { size: number; artColor: string }) {
  return (
    <View style={[styles.cdCaseFrame, { width: size, height: size }]}>
      <View style={styles.cdCaseBackdropWrap}>
        <View
          style={[
            styles.cdCaseBackdrop,
            {
              width: size * 0.82,
              height: size * 0.82,
              backgroundColor: artColor,
            },
          ]}
        />
      </View>
      <Image source={cdCaseSource} style={[styles.cdCaseImage, { width: size, height: size }]} resizeMode="contain" />
    </View>
  );
}

function HiddenSongListPanel({
  songs,
  selectedSongId,
  onSelectSong,
  onPlaySong,
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPreviousPage,
  onNextPage,
}: {
  songs: Song[];
  selectedSongId: string;
  onSelectSong: (songId: string) => void;
  onPlaySong: (songId: string) => void;
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  const scrollbar = useCustomScrollbar();
  const [hoveredSongId, setHoveredSongId] = useState<string | null>(null);
  const [hoveredMiniCdSongId, setHoveredMiniCdSongId] = useState<string | null>(null);

  return (
    <Panel style={styles.secondaryPanel}>
      <SecondarySurfaceFill />
      <View style={styles.secondaryPanelScrollFrame}>
        <ScrollView
          ref={scrollbar.scrollRef}
          style={styles.secondaryPanelScroll}
          contentContainerStyle={styles.songListContent}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => scrollbar.setViewportHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => scrollbar.setContentHeight(height)}
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => scrollbar.setScrollY(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          {songs.map((song, index) => (
            <Pressable
              key={song.id}
              onPress={() => onSelectSong(song.id)}
              onHoverIn={() => setHoveredSongId(song.id)}
              onHoverOut={() => setHoveredSongId((current) => (current === song.id ? null : current))}
              style={styles.songRowShell}
            >
              {({ pressed }) => {
                const selected = selectedSongId === song.id;
                const showGradient =
                  selected || hoveredSongId === song.id || hoveredMiniCdSongId === song.id || pressed;

                return (
                  <>
                    {showGradient ? (
                      <LinearGradient
                        colors={selected ? activeGradient : hoverGradient}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.songRowGradient}
                      />
                    ) : null}
                    <View style={[styles.songRow, showGradient ? styles.songRowActive : null]}>
                      <Text style={[styles.songRowRank, showGradient ? styles.songTextActive : null]}>{index + 1}.</Text>
                      <View style={styles.songCopy}>
                        <View style={styles.songTitleRow}>
                          <Text style={[styles.songRowTitle, showGradient ? styles.songTextActive : null]}>{song.title}</Text>
                        </View>
                        <Text style={[styles.songRowArtist, showGradient ? styles.songTextActive : null]}>{song.artist}</Text>
                      </View>
                      <Pressable
                        style={styles.miniCdHoverTarget}
                        onHoverIn={() => setHoveredMiniCdSongId(song.id)}
                        onHoverOut={() => setHoveredMiniCdSongId((current) => (current === song.id ? null : current))}
                        onPress={(event) => {
                          (event as any)?.stopPropagation?.();
                          onPlaySong(song.id);
                        }}
                      >
                        <MiniCdCase
                          color={rowBackdropColors[index % rowBackdropColors.length]}
                          showPlayButton={hoveredMiniCdSongId === song.id}
                        />
                      </Pressable>
                    </View>
                  </>
                );
              }}
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.paginationBar}>
          <Pressable
            onPress={onPreviousPage}
            disabled={!hasPreviousPage}
            style={[styles.paginationButtonShell, !hasPreviousPage ? styles.paginationButtonShellDisabled : null]}
          >
            <Text style={styles.paginationButtonText}>Previous Page</Text>
          </Pressable>
          <Text style={styles.paginationLabel}>{`Page ${page} of ${totalPages}`}</Text>
          <Pressable
            onPress={onNextPage}
            disabled={!hasNextPage}
            style={[styles.paginationButtonShell, !hasNextPage ? styles.paginationButtonShellDisabled : null]}
          >
            <Text style={styles.paginationButtonText}>Next Page</Text>
          </Pressable>
        </View>
        {scrollbar.scrollbarVisible ? (
          <View
            ref={scrollbar.trackRef}
            style={styles.scrollbarTrack}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => scrollbar.scrollToTrackLocation(event.nativeEvent.locationY)}
            onResponderMove={(event) => scrollbar.scrollToTrackLocation(event.nativeEvent.locationY)}
            {...(Platform.OS === "web"
              ? ({
                  onMouseDown: (event: any) => {
                    event.preventDefault();
                    scrollbar.setIsDraggingScrollbar(true);
                    scrollbar.scrollToClientY(event.clientY);
                  },
                } as any)
              : {})}
          >
            <View style={[styles.scrollbarThumb, { height: scrollbar.thumbHeight, transform: [{ translateY: scrollbar.thumbTop }] }]} />
          </View>
        ) : null}
      </View>
    </Panel>
  );
}

function FeaturedArtistsSection({
  country,
  selectedYear,
  artists,
  useLoadingLabels = false,
}: {
  country: Country;
  selectedYear: number;
  artists: string[];
  useLoadingLabels?: boolean;
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
    <Panel style={styles.snapshotPanel}>
      <SecondarySurfaceFill />
      <Text style={styles.panelTitle}>{`${useLoadingLabels ? "Loading..." : country.name}'s Favorite Artists in ${selectedYear}`}</Text>
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
            <View key={`${artist}-${index}`} style={styles.favoriteArtistItem}>
              <CdCase size={104} artColor={rowBackdropColors[index % rowBackdropColors.length]} />
              <Text style={styles.favoriteArtistName}>{useLoadingLabels ? "Loading..." : artist}</Text>
              <Text style={styles.favoriteArtistSongName} />
            </View>
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
    </Panel>
  );
}

function PlayingSidePanel({
  selectedSong,
  isPlayingPreview,
  onTogglePreview,
  onPreviousSong,
  onNextSong,
}: {
  selectedSong: Song;
  isPlayingPreview: boolean;
  onTogglePreview: () => void;
  onPreviousSong: () => void;
  onNextSong: () => void;
}) {
  const scrollbar = useCustomScrollbar();
  const [isHoveringMainCd, setIsHoveringMainCd] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  const showControls = isHoveringMainCd || showTouchControls;

  return (
    <Panel style={[styles.secondaryPanel, styles.playingPanel]}>
      <SecondarySurfaceFill />
      <View style={styles.secondaryPanelScrollFrame}>
        <ScrollView
          ref={scrollbar.scrollRef}
          style={styles.secondaryPanelScroll}
          contentContainerStyle={styles.playingSideContent}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => scrollbar.setViewportHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => scrollbar.setContentHeight(height)}
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => scrollbar.setScrollY(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          <View style={styles.blankCdCaseWrap}>
            <View
              style={styles.mainCdHoverTarget}
              onTouchStart={() => setShowTouchControls(true)}
              {...(Platform.OS === "web"
                ? ({
                    onMouseEnter: () => setIsHoveringMainCd(true),
                    onMouseLeave: () => setIsHoveringMainCd(false),
                  } as any)
                : {})}
            >
              <BlankCdCase />
              {showControls ? (
                <View style={styles.mainCdControlsOverlay}>
                  <Pressable style={styles.mainCdControlButton} onPress={onPreviousSong}>
                    <LinearGradient
                      colors={controlButtonGradient}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.mainCdControlFill}
                    />
                    <Text style={[styles.mainCdControlIcon, styles.mainCdControlIconSkipLeft]}>⏮</Text>
                  </Pressable>
                  <Pressable style={styles.mainCdControlButtonPrimary} onPress={onTogglePreview}>
                    <LinearGradient
                      colors={controlButtonGradient}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.mainCdControlFill}
                    />
                    <Text style={styles.mainCdControlIconPrimary}>{isPlayingPreview ? "⏸" : "▶"}</Text>
                  </Pressable>
                  <Pressable style={styles.mainCdControlButton} onPress={onNextSong}>
                    <LinearGradient
                      colors={controlButtonGradient}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.mainCdControlFill}
                    />
                    <Text style={[styles.mainCdControlIcon, styles.mainCdControlIconSkipRight]}>⏭</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          <Text numberOfLines={1} style={styles.playingSongLine}>
            <Text style={styles.playingSongName}>{selectedSong.title}</Text>
            {"\u00A0\u00A0"}
            <Text style={styles.playingSongBy}>by</Text>
            {"  "}
            <Text style={styles.playingSongArtistInline}>{selectedSong.artist}</Text>
          </Text>
          <View style={styles.playingSongUnderline} />

          <View style={styles.playingMetaBlock}>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Artist Name: </Text>
                <Text style={styles.playingMetaValue}>{selectedSong.artist}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Album Name: </Text>
                <Text style={styles.playingMetaValue}>{selectedSong.album}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Genre(s): </Text>
                <Text style={styles.playingMetaValue}>{selectedSong.genres.join(", ")}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Language(s): </Text>
                <Text style={styles.playingMetaValue}>{selectedSong.languages.join(", ")}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Release Date: </Text>
                <Text style={styles.playingMetaValue}>{selectedSong.year}</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
        {scrollbar.scrollbarVisible ? (
          <View
            ref={scrollbar.trackRef}
            style={styles.scrollbarTrack}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => scrollbar.scrollToTrackLocation(event.nativeEvent.locationY)}
            onResponderMove={(event) => scrollbar.scrollToTrackLocation(event.nativeEvent.locationY)}
            {...(Platform.OS === "web"
              ? ({
                  onMouseDown: (event: any) => {
                    event.preventDefault();
                    scrollbar.setIsDraggingScrollbar(true);
                    scrollbar.scrollToClientY(event.clientY);
                  },
                } as any)
              : {})}
          >
            <View style={[styles.scrollbarThumb, { height: scrollbar.thumbHeight, transform: [{ translateY: scrollbar.thumbTop }] }]} />
          </View>
        ) : null}
      </View>
    </Panel>
  );
}

export function HiddenGemsScreen({
  country,
  countries,
  availableYears,
  onSelectCountry,
  selectedYear,
  onChangeYear,
  onSetLoading,
  showNavIntro = false,
  onDismissNavIntro,
}: Props) {
  const { width } = useWindowDimensions();
  const isStacked = width < 1120;
  const isBlurbStacked = width < 1380;
  const [apiProfile, setApiProfile] = useState<ReturnType<typeof mapApiCountryProfile> | null>(null);
  const [apiSongs, setApiSongs] = useState<Song[] | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const hiddenGemSongs = useMemo(() => apiSongs ?? [], [apiSongs]);
  const [activeSongId, setActiveSongId] = useState<string>(() => hiddenGemSongs[0]?.id || "");
  const safeSelectedSong = hiddenGemSongs.find((song) => song.id === activeSongId) ?? hiddenGemSongs[0];
  const [previewSongId, setPreviewSongId] = useState<string>(safeSelectedSong?.id ?? "");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [isCountryDropdownHovered, setIsCountryDropdownHovered] = useState(false);
  const [isCountryDropdownPressed, setIsCountryDropdownPressed] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [isYearDropdownHovered, setIsYearDropdownHovered] = useState(false);
  const [isYearDropdownPressed, setIsYearDropdownPressed] = useState(false);
  const [isFilterButtonHovered, setIsFilterButtonHovered] = useState(false);
  const [isFilterButtonPressed, setIsFilterButtonPressed] = useState(false);
  const [introCountryId, setIntroCountryId] = useState(country.id);
  const [introYear, setIntroYear] = useState<number | null>(null);
  const [isIntroCountryDropdownOpen, setIsIntroCountryDropdownOpen] = useState(false);
  const [isIntroYearDropdownOpen, setIsIntroYearDropdownOpen] = useState(false);
  const yearOptions = useMemo(
    () => (availableYears.length > 0 ? availableYears.slice().sort((a, b) => b - a) : [selectedYear]),
    [availableYears, selectedYear]
  );
  const countryOptions = useMemo(() => {
    const filtered = countries.filter((item) => item.hiddenSongs > 0);
    const source = filtered.length ? filtered : countries;
    return source.slice().sort((left, right) => left.name.localeCompare(right.name));
  }, [countries]);
  const showCountryDropdownGradient = isCountryDropdownHovered || isCountryDropdownPressed || isCountryDropdownOpen;
  const showYearDropdownGradient = isYearDropdownHovered || isYearDropdownPressed || isYearDropdownOpen;
  const showFilterButtonGradient = isFiltersOpen || isFilterButtonHovered || isFilterButtonPressed;
  const introCountryLabel = countryOptions.find((item) => item.id === introCountryId)?.name ?? "Select Country";
  const fallbackSong: Song = {
    id: `${country.code}-${selectedYear}-placeholder`,
    title: "Loading...",
    artist: "Loading...",
    album: "Loading...",
    genres: ["Loading..."],
    languages: ["Loading..."],
    year: selectedYear,
    duration: "",
    description: "",
    spotifySearchUrl: "",
  };
  const selectedSong = safeSelectedSong ?? fallbackSong;
  const shouldShowNavIntro = showNavIntro || hiddenGemSongs.length === 0;
  const displayCountryName = shouldShowNavIntro ? "Loading..." : country.name;

  useEffect(() => {
    if (!shouldShowNavIntro) {
      return;
    }
    setIntroCountryId(country.id);
    setIntroYear(null);
    setIsIntroCountryDropdownOpen(false);
    setIsIntroYearDropdownOpen(false);
  }, [country.id, selectedYear, shouldShowNavIntro]);

  useEffect(() => {
    setPage(1);
  }, [country.code, selectedYear]);

  useEffect(() => {
    let isCancelled = false;
    loadCountryProfile(country.code, selectedYear)
      .then((profilePayload) => {
        if (isCancelled) {
          return;
        }
        setApiProfile(mapApiCountryProfile(profilePayload));
      })
      .catch(() => {
        if (!isCancelled) {
          setApiProfile(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [country.code, selectedYear]);

  useEffect(() => {
    let isCancelled = false;
    onSetLoading?.(true);
    loadHiddenGemsPage(country.code, selectedYear, 2, page, 25)
      .then((response) => {
        if (isCancelled) {
          return;
        }
        const safeResponse = {
          items: Array.isArray(response?.items) ? response.items : [],
          page: typeof response?.page === "number" ? response.page : page,
          pageSize: typeof response?.pageSize === "number" ? response.pageSize : 25,
          totalCount: typeof response?.totalCount === "number" ? response.totalCount : 0,
          hasMore: Boolean(response?.hasMore),
        };
        const mapped = mapApiHiddenGemPage(safeResponse);
        const nextSongs: Song[] = mapped.items.map((item, index) => ({
          id: `${country.code}-${selectedYear}-page-${page}-${index + 1}`,
          title: item.title,
          artist: item.artist,
          album: item.album,
          genres: item.genre ? [item.genre] : [],
          languages: [],
          year: selectedYear,
          duration: "",
          description: `Trending in ${item.countriesChartingCount} countries`,
          spotifySearchUrl: item.previewUrl || "",
        }));
        setApiSongs(nextSongs);
        setHasNextPage(safeResponse.hasMore);
        setTotalPages(Math.max(1, Math.ceil(safeResponse.totalCount / safeResponse.pageSize)));
        onSetLoading?.(false);
      })
      .catch(() => {
        if (!isCancelled) {
          setApiSongs([]);
          setHasNextPage(false);
          setTotalPages(1);
          onSetLoading?.(false);
        }
      });

    return () => {
      isCancelled = true;
      onSetLoading?.(false);
    };
  }, [country.code, onSetLoading, page, selectedYear]);

  useEffect(() => {
    if (!hiddenGemSongs.length) {
      if (activeSongId !== "") {
        setActiveSongId("");
      }
      return;
    }
    if (hiddenGemSongs.some((song) => song.id === activeSongId)) {
      return;
    }
    setActiveSongId(hiddenGemSongs[0].id);
  }, [activeSongId, hiddenGemSongs]);

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

  const selectedSongIndex = hiddenGemSongs.findIndex((song) => song.id === selectedSong.id);

  const setSongSelection = (songId: string) => {
    setActiveSongId(songId);
  };

  const selectSongAndAutoPlay = (songId: string) => {
    setSongSelection(songId);
    setPreviewSongId(songId);
    setIsPreviewPlaying(true);
  };

  const stepSong = (direction: -1 | 1) => {
    if (!hiddenGemSongs.length || selectedSongIndex < 0) {
      return;
    }
    const nextIndex = (selectedSongIndex + direction + hiddenGemSongs.length) % hiddenGemSongs.length;
    const nextSong = hiddenGemSongs[nextIndex];
    if (!nextSong) {
      return;
    }
    setSongSelection(nextSong.id);
    setPreviewSongId(nextSong.id);
    setIsPreviewPlaying(true);
  };

  const toggleSelectedSongPreview = () => {
    if (previewSongId !== selectedSong.id) {
      setPreviewSongId(selectedSong.id);
      setIsPreviewPlaying(true);
      return;
    }
    setIsPreviewPlaying((current) => !current);
  };

  return (
    <ScreenScaffold disableScroll={shouldShowNavIntro}>
      <View style={styles.pageFrame}>
        <Panel style={styles.blurbPanel}>
          <LinearGradient
            colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.42)", "rgba(66,72,101,0.72)"]}
            locations={[0, 0.42, 0.78, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.blurbFill}
          />
          <View style={[styles.blurbContent, isBlurbStacked ? styles.blurbContentStacked : null]}>
            <View style={[styles.blurbCopy, isBlurbStacked ? styles.blurbCopyStacked : null]}>
              <Text style={styles.blurbText}>
                <Text style={styles.blurbHeading}>{displayCountryName}&apos;s Hidden Gems</Text>
                {"  "}
                <GemIcon size={16} style={styles.blurbIcon} />
                {"  "}
                <Text style={styles.blurbBody}>
                  Hidden gems are songs that are loved in this country, but have not spread as widely across other
                  countries as of your selected year. Select optional filter(s), a country, and a year to view that
                  country&apos;s Hidden Gems. Hover over the selected song&apos;s CD to view the previous, play, and
                  skip buttons. Click play to listen to a 30-second preview of the song.
                </Text>
              </Text>
            </View>
            <View style={[styles.blurbRightRail, isBlurbStacked ? styles.blurbRightRailStacked : null]}>
              <View style={[styles.blurbControlsRow, isBlurbStacked ? styles.blurbControlsRowStacked : null]}>
                <View style={styles.blurbFiltersDropdownWrap}>
                  <Pressable
                    onPress={() => {
                      setIsFiltersOpen((current) => !current);
                      setIsCountryDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                    }}
                    onHoverIn={() => setIsFilterButtonHovered(true)}
                    onHoverOut={() => setIsFilterButtonHovered(false)}
                    onPressIn={() => setIsFilterButtonPressed(true)}
                    onPressOut={() => setIsFilterButtonPressed(false)}
                    style={styles.filterActionButtonShell}
                  >
                    {showFilterButtonGradient ? (
                      <LinearGradient
                        colors={
                          isFilterButtonPressed
                            ? activeGradient
                            : ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"]
                        }
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.filterActionButtonGradient}
                      />
                    ) : null}
                    <View style={[styles.filterActionButton, showFilterButtonGradient ? styles.filterActionButtonActive : null]}>
                      <View style={styles.filterActionButtonContent}>
                        <GemIcon size={18} />
                        <Text style={[styles.filterActionButtonText, showFilterButtonGradient ? styles.filterActionButtonTextActive : null]}>
                          Filters
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
                <View style={styles.blurbDropdownStack}>
                <View style={[styles.blurbYearDropdownWrap, styles.blurbCountryDropdownWrap]}>
                  <Pressable
                    onPress={() => {
                      setIsCountryDropdownOpen((current) => !current);
                      setIsYearDropdownOpen(false);
                    }}
                    onHoverIn={() => setIsCountryDropdownHovered(true)}
                    onHoverOut={() => setIsCountryDropdownHovered(false)}
                    onPressIn={() => setIsCountryDropdownPressed(true)}
                    onPressOut={() => setIsCountryDropdownPressed(false)}
                    style={styles.blurbYearDropdownShell}
                  >
                    {showCountryDropdownGradient ? (
                      <LinearGradient
                        colors={isCountryDropdownPressed ? activeGradient : hoverGradient}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.blurbYearDropdownButtonGradient}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.blurbYearDropdownButton,
                        showCountryDropdownGradient ? styles.blurbYearDropdownButtonActive : null,
                      ]}
                    >
                      <Text style={styles.blurbYearDropdownText}>{displayCountryName}</Text>
                      <Text style={styles.blurbYearDropdownChevron}>{isCountryDropdownOpen ? "-" : "+"}</Text>
                    </View>
                  </Pressable>
                  {isCountryDropdownOpen ? (
                    <Panel style={styles.blurbYearDropdownMenu}>
                      <SecondarySurfaceFill />
                      <ScrollView style={styles.blurbYearDropdownScroll} contentContainerStyle={styles.blurbYearDropdownContent}>
                        <Pressable
                          onHoverIn={() => setHoveredCountryId("__select_country__")}
                          onHoverOut={() => setHoveredCountryId((current) => (current === "__select_country__" ? null : current))}
                          onPress={() => setIsCountryDropdownOpen(false)}
                          style={styles.blurbYearDropdownOptionShell}
                        >
                          {hoveredCountryId === "__select_country__" ? (
                            <LinearGradient
                              colors={hoverGradient}
                              locations={[0, 0.34, 1]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={styles.blurbYearDropdownOptionGradient}
                            />
                          ) : null}
                          <View
                            style={[
                              styles.blurbYearDropdownOption,
                              hoveredCountryId === "__select_country__" ? styles.blurbYearDropdownOptionActive : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.blurbYearDropdownOptionText,
                                hoveredCountryId === "__select_country__" ? styles.blurbYearDropdownOptionTextActive : null,
                              ]}
                            >
                              Select Country
                            </Text>
                          </View>
                        </Pressable>
                        {countryOptions.map((countryOption) => {
                          if (!countryOption?.id) {
                            return null;
                          }
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
                                setPage(1);
                                setIsCountryDropdownOpen(false);
                              }}
                              style={styles.blurbYearDropdownOptionShell}
                            >
                              {showOptionGradient ? (
                                <LinearGradient
                                  colors={selected ? activeGradient : hoverGradient}
                                  locations={[0, 0.34, 1]}
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={styles.blurbYearDropdownOptionGradient}
                                />
                              ) : null}
                              <View
                                style={[
                                  styles.blurbYearDropdownOption,
                                  showOptionGradient ? styles.blurbYearDropdownOptionActive : null,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.blurbYearDropdownOptionText,
                                    showOptionGradient ? styles.blurbYearDropdownOptionTextActive : null,
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

                <View style={[styles.blurbYearDropdownWrap, styles.blurbBottomYearDropdownWrap]}>
                  <Pressable
                    onPress={() => {
                      setIsYearDropdownOpen((current) => !current);
                      setIsCountryDropdownOpen(false);
                    }}
                    onHoverIn={() => setIsYearDropdownHovered(true)}
                    onHoverOut={() => setIsYearDropdownHovered(false)}
                    onPressIn={() => setIsYearDropdownPressed(true)}
                    onPressOut={() => setIsYearDropdownPressed(false)}
                    style={styles.blurbYearDropdownShell}
                  >
                    {showYearDropdownGradient ? (
                      <LinearGradient
                        colors={isYearDropdownPressed ? activeGradient : hoverGradient}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.blurbYearDropdownButtonGradient}
                      />
                    ) : null}
                    <View style={[styles.blurbYearDropdownButton, showYearDropdownGradient ? styles.blurbYearDropdownButtonActive : null]}>
                      <Text style={styles.blurbYearDropdownText}>{selectedYear}</Text>
                      <Text style={styles.blurbYearDropdownChevron}>{isYearDropdownOpen ? "-" : "+"}</Text>
                    </View>
                  </Pressable>
                  {isYearDropdownOpen ? (
                    <Panel style={styles.blurbYearDropdownMenu}>
                      <SecondarySurfaceFill />
                      <ScrollView style={styles.blurbYearDropdownScroll} contentContainerStyle={styles.blurbYearDropdownContent}>
                        <Pressable
                          onHoverIn={() => setHoveredYear(0)}
                          onHoverOut={() => setHoveredYear((current) => (current === 0 ? null : current))}
                          onPress={() => setIsYearDropdownOpen(false)}
                          style={styles.blurbYearDropdownOptionShell}
                        >
                          {hoveredYear === 0 ? (
                            <LinearGradient
                              colors={hoverGradient}
                              locations={[0, 0.34, 1]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={styles.blurbYearDropdownOptionGradient}
                            />
                          ) : null}
                          <View style={[styles.blurbYearDropdownOption, hoveredYear === 0 ? styles.blurbYearDropdownOptionActive : null]}>
                            <Text
                              style={[styles.blurbYearDropdownOptionText, hoveredYear === 0 ? styles.blurbYearDropdownOptionTextActive : null]}
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
                              style={styles.blurbYearDropdownOptionShell}
                            >
                              {showOptionGradient ? (
                                <LinearGradient
                                  colors={selected ? activeGradient : hoverGradient}
                                  locations={[0, 0.34, 1]}
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={styles.blurbYearDropdownOptionGradient}
                                />
                              ) : null}
                              <View
                                style={[
                                  styles.blurbYearDropdownOption,
                                  showOptionGradient ? styles.blurbYearDropdownOptionActive : null,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.blurbYearDropdownOptionText,
                                    showOptionGradient ? styles.blurbYearDropdownOptionTextActive : null,
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
              </View>
              {isFiltersOpen ? (
                <Panel style={styles.filtersModal}>
                  <SecondarySurfaceFill />
                  <Text style={styles.filtersModalTitle}>All Filters</Text>
                  <Text style={styles.filtersModalLine}>Genre(s): Genre info coming soon.</Text>
                  <Text style={styles.filtersModalLine}>Language(s): Language info coming soon.</Text>
                </Panel>
              ) : null}
              <View style={styles.blurbStatCardShell}>
                <LinearGradient
                  colors={[colors.backgroundSoft, "#74819B", "#7A4762"]}
                  locations={[0, 0.38, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.blurbStatCardFill}
                />
                <Text style={styles.blurbStatValue}>{country.hiddenSongs}</Text>
                <Text style={styles.blurbStatLabel}>Hidden Gems</Text>
              </View>
            </View>
          </View>
        </Panel>
        <View style={[styles.layout, isStacked ? styles.layoutStacked : null]}>
          <View style={styles.panelColumn}>
            <PlayingSidePanel
              selectedSong={selectedSong}
              isPlayingPreview={isPreviewPlaying && previewSongId === selectedSong.id}
              onTogglePreview={toggleSelectedSongPreview}
              onPreviousSong={() => stepSong(-1)}
              onNextSong={() => stepSong(1)}
            />
          </View>
          <View style={styles.panelColumn}>
            <HiddenSongListPanel
              songs={hiddenGemSongs}
              selectedSongId={selectedSong.id}
              onSelectSong={setSongSelection}
              onPlaySong={selectSongAndAutoPlay}
              page={page}
              totalPages={totalPages}
              hasPreviousPage={page > 1}
              hasNextPage={hasNextPage}
              onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
              onNextPage={() => {
                if (hasNextPage) {
                  setPage((current) => current + 1);
                }
              }}
            />
          </View>
          <FeaturedArtistsSection
            country={country}
            selectedYear={selectedYear}
            artists={favoriteArtists}
            useLoadingLabels={shouldShowNavIntro}
          />
        </View>
      </View>
      {shouldShowNavIntro ? (
        <View style={styles.navIntroOverlay}>
          <View style={styles.navIntroOverlayGradientWrap}>
            <LinearGradient
              colors={["rgba(22,26,38,0.62)", "rgba(22,26,38,0.36)", "rgba(66,72,101,0.18)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.navIntroOverlayGradient}
            />
            <LinearGradient
              colors={["rgba(117,82,107,0.16)", "rgba(117,82,107,0.05)", "rgba(117,82,107,0.00)"]}
              start={{ x: 0.0, y: 0.04 }}
              end={{ x: 1.0, y: 0.72 }}
              style={styles.navIntroOverlayGradient}
            />
          </View>
          <Panel style={styles.navIntroModal}>
            <Text style={styles.navIntroTitle}>Hidden Gems</Text>
            <Text style={styles.navIntroBody}>
              To view a country&apos;s hidden gems, select a country and a year. After selecting, you will also be able
              to select a different country and/or year on the top of the page, to further your discovery.
            </Text>
            <View style={styles.navIntroControls}>
              <View style={styles.navIntroDropdownWrap}>
                <Pressable
                  onPress={() => {
                    setIsIntroCountryDropdownOpen((current) => !current);
                    setIsIntroYearDropdownOpen(false);
                  }}
                  style={styles.blurbYearDropdownShell}
                >
                  <View style={styles.blurbYearDropdownButton}>
                    <Text style={styles.blurbYearDropdownText}>{introCountryLabel}</Text>
                    <Text style={styles.blurbYearDropdownChevron}>{isIntroCountryDropdownOpen ? "-" : "+"}</Text>
                  </View>
                </Pressable>
                {isIntroCountryDropdownOpen ? (
                  <Panel style={styles.blurbYearDropdownMenu}>
                    <SecondarySurfaceFill />
                    <ScrollView style={styles.blurbYearDropdownScroll} contentContainerStyle={styles.blurbYearDropdownContent}>
                      {countryOptions.map((countryOption) => (
                        <Pressable
                          key={`intro-${countryOption.id}`}
                          onPress={() => {
                            setIntroCountryId(countryOption.id);
                            setIsIntroCountryDropdownOpen(false);
                          }}
                          style={styles.blurbYearDropdownOptionShell}
                        >
                          <View
                            style={[
                              styles.blurbYearDropdownOption,
                              countryOption.id === introCountryId ? styles.blurbYearDropdownOptionActive : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.blurbYearDropdownOptionText,
                                countryOption.id === introCountryId ? styles.blurbYearDropdownOptionTextActive : null,
                              ]}
                            >
                              {countryOption.name}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </Panel>
                ) : null}
              </View>
              <View style={styles.navIntroDropdownWrap}>
                <Pressable
                  onPress={() => {
                    setIsIntroYearDropdownOpen((current) => !current);
                    setIsIntroCountryDropdownOpen(false);
                  }}
                  style={styles.blurbYearDropdownShell}
                >
                  <View style={styles.blurbYearDropdownButton}>
                    <Text style={[styles.blurbYearDropdownText, introYear == null ? styles.blurbYearDropdownTextPlaceholder : null]}>
                      {introYear == null ? "Select Year" : introYear}
                    </Text>
                    <Text style={styles.blurbYearDropdownChevron}>{isIntroYearDropdownOpen ? "-" : "+"}</Text>
                  </View>
                </Pressable>
                {isIntroYearDropdownOpen ? (
                  <Panel style={styles.blurbYearDropdownMenu}>
                    <SecondarySurfaceFill />
                    <ScrollView style={styles.blurbYearDropdownScroll} contentContainerStyle={styles.blurbYearDropdownContent}>
                      {yearOptions.map((year) => (
                        <Pressable
                          key={`intro-year-${year}`}
                          onPress={() => {
                            setIntroYear(year);
                            setIsIntroYearDropdownOpen(false);
                          }}
                          style={styles.blurbYearDropdownOptionShell}
                        >
                          <View
                            style={[
                              styles.blurbYearDropdownOption,
                              year === introYear ? styles.blurbYearDropdownOptionActive : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.blurbYearDropdownOptionText,
                                year === introYear ? styles.blurbYearDropdownOptionTextActive : null,
                              ]}
                            >
                              {year}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </Panel>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={() => {
                if (introCountryId !== country.id) {
                  onSelectCountry(introCountryId);
                }
                if (introYear != null && introYear !== selectedYear) {
                  onChangeYear(introYear);
                }
                onDismissNavIntro?.();
              }}
              style={styles.navIntroButtonShell}
            >
              <Text style={styles.navIntroButtonText}>Discover Hidden Gems</Text>
            </Pressable>
          </Panel>
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  navIntroOverlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 15000,
    elevation: 15000,
    ...(Platform.OS === "web"
      ? ({
          position: "fixed",
        } as ViewStyle)
      : null),
  },
  navIntroOverlayGradientWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  navIntroOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  navIntroModal: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(169, 176, 209, 0.24)",
    backgroundColor: colors.panel,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "center",
    gap: 14,
  },
  navIntroControls: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    zIndex: 200,
  },
  navIntroDropdownWrap: {
    width: 180,
    zIndex: 220,
  },
  navIntroTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 26,
    lineHeight: 30,
    textAlign: "center",
  },
  navIntroBody: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  navIntroButtonShell: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    minHeight: 40,
    minWidth: 112,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  navIntroButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 17,
    lineHeight: 19,
  },
  pageFrame: {
    flex: 1,
    marginTop: -4,
    gap: 16,
  },
  blurbPanel: {
    minHeight: 74,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    overflow: "visible",
    zIndex: 6,
  },
  blurbFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  blurbContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  blurbContentStacked: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },
  blurbCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 18,
    justifyContent: "flex-start",
    transform: [{ translateY: 1 }],
  },
  blurbCopyStacked: {
    width: "100%",
    paddingRight: 0,
  },
  blurbText: {
    textAlign: "left",
  },
  blurbIcon: {
    transform: [{ translateY: 1 }],
  },
  blurbHeading: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  blurbBody: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  blurbRightRail: {
    width: 392,
    minWidth: 392,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    position: "relative",
  },
  blurbRightRailStacked: {
    width: "100%",
    minWidth: 0,
    justifyContent: "flex-end",
  },
  blurbControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: "auto",
  },
  blurbControlsRowStacked: {
    flexWrap: "wrap",
    rowGap: 8,
    justifyContent: "flex-end",
  },
  blurbDropdownStack: {
    width: 156,
    gap: 8,
    position: "relative",
    zIndex: 100,
    overflow: "visible",
  },
  blurbStatCardShell: {
    width: 82,
    height: 82,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "transparent",
    paddingHorizontal: 7,
    paddingTop: 11,
    paddingBottom: 6,
    justifyContent: "flex-start",
    shadowColor: colors.accent,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    gap: 2,
    overflow: "hidden",
  },
  blurbStatCardFill: {
    ...StyleSheet.absoluteFillObject,
  },
  blurbStatLabel: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 13,
    textAlign: "center",
    marginTop: 5,
  },
  blurbStatValue: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 30,
    lineHeight: 30,
    textAlign: "center",
    marginTop: 3,
  },
  blurbYearDropdownWrap: {
    width: 156,
    position: "relative",
    zIndex: 10,
    alignItems: "stretch",
    justifyContent: "center",
  },
  blurbCountryDropdownWrap: {
    zIndex: 14,
  },
  blurbBottomYearDropdownWrap: {
    zIndex: 11,
  },
  blurbFiltersDropdownWrap: {
    width: 116,
    zIndex: 15,
    alignSelf: "center",
  },
  filterActionButtonShell: {
    borderRadius: 14,
    overflow: "hidden",
  },
  filterActionButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  filterActionButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
  },
  filterActionButtonActive: {
    backgroundColor: "transparent",
  },
  filterActionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  filterActionButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  filterActionButtonTextActive: {
    color: colors.textLight,
  },
  blurbYearDropdownShell: {
    borderRadius: 17,
    overflow: "hidden",
  },
  blurbYearDropdownButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  blurbYearDropdownButton: {
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
  blurbYearDropdownButtonActive: {
    backgroundColor: "transparent",
  },
  blurbYearDropdownText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    lineHeight: 18,
  },
  blurbYearDropdownTextPlaceholder: {
    opacity: 0.78,
  },
  blurbYearDropdownChevron: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 28,
    lineHeight: 28,
  },
  blurbYearDropdownMenu: {
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
  blurbYearDropdownScroll: {
    maxHeight: 260,
  },
  blurbYearDropdownContent: {
    padding: 8,
    gap: 8,
  },
  blurbYearDropdownOptionShell: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  blurbYearDropdownOptionGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  blurbYearDropdownOption: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
  },
  blurbYearDropdownOptionActive: {
    backgroundColor: "transparent",
  },
  blurbYearDropdownOptionText: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
  },
  blurbYearDropdownOptionTextActive: {
    color: colors.textLight,
  },
  filtersModal: {
    position: "absolute",
    right: 252,
    top: 46,
    width: 236,
    minHeight: 122,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 20,
    backgroundColor: "transparent",
  },
  filtersModalTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 6,
  },
  filtersModalLine: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
  },
  layout: {
    flexDirection: "column",
    gap: 12,
    alignItems: "stretch",
  },
  layoutStacked: {
    flexDirection: "column",
  },
  panelColumn: {
    width: "100%",
    minWidth: 0,
  },
  secondaryPanel: {
    minHeight: 618,
    maxHeight: 618,
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  secondaryPanelScrollFrame: {
    flex: 1,
    position: "relative",
  },
  secondaryPanelScroll: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
          scrollbarWidth: "none",
        } as ViewStyle)
      : null),
  },
  songListContent: {
    paddingLeft: 14,
    paddingRight: 24,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 6,
  },
  paginationBar: {
    borderTopWidth: 1,
    borderTopColor: "rgba(212,224,249,0.28)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  paginationButtonShell: {
    minWidth: 104,
    minHeight: 34,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  paginationButtonShellDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 13,
    lineHeight: 15,
  },
  paginationLabel: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 14,
    lineHeight: 16,
  },
  playingSideContent: {
    paddingLeft: 14,
    paddingRight: 24,
    paddingTop: 2,
    paddingBottom: 24,
    gap: 10,
    alignItems: "center",
  },
  playingPanel: {
    minHeight: 760,
    maxHeight: 760,
  },
  songRowShell: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
  },
  songRowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  songRow: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  songRowActive: {
    backgroundColor: "transparent",
  },
  songRowRank: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 18,
    lineHeight: 18,
    minWidth: 26,
    textAlign: "left",
  },
  songCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  songTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  songRowTitle: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 16,
    lineHeight: 17,
  },
  songRowArtist: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 13,
    lineHeight: 14,
  },
  songTextActive: {
    color: colors.textLight,
  },
  miniCdCaseFrame: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCdHoverTarget: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCdCaseBackdropWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  miniCdCaseBackdrop: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  miniCdCaseImage: {
    width: 54,
    height: 54,
  },
  miniCdPlayOverlay: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  miniCdPlayOverlayFill: {
    ...StyleSheet.absoluteFillObject,
  },
  miniCdPlayIcon: {
    color: colors.textLight,
    fontSize: 16,
    lineHeight: 16,
    width: 16,
    textAlign: "center",
    marginLeft: 1,
  },
  blankCdCaseWrap: {
    width: "100%",
    alignItems: "center",
    marginBottom: -6,
  },
  blankCdCaseFrame: {
    width: 450,
    height: 450,
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  blankCdCaseBackdropWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  blankCdCaseBackdrop: {
    width: 369,
    height: 369,
    borderRadius: 16,
    backgroundColor: "rgba(212,224,249,0.18)",
  },
  blankCdCaseImage: {
    width: 450,
    height: 450,
    maxWidth: "100%",
  },
  mainCdHoverTarget: {
    width: 450,
    height: 450,
    maxWidth: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  mainCdControlsOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: "transparent",
  },
  mainCdControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    shadowColor: colors.shadow,
    shadowOpacity: 0.34,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  mainCdControlButtonPrimary: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    shadowColor: colors.shadow,
    shadowOpacity: 0.38,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 12,
  },
  mainCdControlFill: {
    ...StyleSheet.absoluteFillObject,
  },
  mainCdControlIcon: {
    color: colors.textLight,
    fontSize: 22,
    lineHeight: 22,
    width: 22,
    textAlign: "center",
  },
  mainCdControlIconSkipLeft: {
    transform: [{ translateX: -1 }],
  },
  mainCdControlIconSkipRight: {
    transform: [{ translateX: 1 }],
  },
  mainCdControlIconPrimary: {
    color: colors.textLight,
    fontSize: 28,
    lineHeight: 28,
    width: 28,
    textAlign: "center",
    transform: [{ translateX: 1 }],
  },
  playingSongLine: {
    width: "100%",
    textAlign: "center",
    marginTop: -2,
    marginBottom: 2,
  },
  playingSongUnderline: {
    width: "100%",
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: -1,
    marginBottom: 2,
  },
  playingSongName: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 27,
    lineHeight: 31,
  },
  playingSongBy: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 22,
    lineHeight: 31,
  },
  playingSongArtistInline: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 22,
    lineHeight: 31,
  },
  playingMetaBlock: {
    width: "96%",
    marginLeft: 12,
    gap: 6,
  },
  playingMetaCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(108,118,144,0.32)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  playingMetaLine: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "left",
  },
  playingMetaLabel: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 17,
    lineHeight: 22,
  },
  playingMetaValue: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    lineHeight: 22,
  },
  scrollbarTrack: {
    position: "absolute",
    top: 10,
    right: 6,
    bottom: 10,
    width: 9,
    borderRadius: 999,
    backgroundColor: "rgba(108,118,143,0.45)",
  },
  scrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(117,82,107,0.58)",
  },
  snapshotPanel: {
    minWidth: 0,
    overflow: "hidden",
  },
  panelTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 10,
  },
  favoriteArtistsRow: {
    flexDirection: "row",
    paddingTop: 4,
    paddingBottom: 0,
    gap: 10,
    flexWrap: "nowrap",
    alignItems: "flex-start",
    paddingRight: 12,
    justifyContent: "flex-start",
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
  favoriteArtistItem: {
    alignItems: "center",
    gap: 10,
    width: 118,
    flexShrink: 0,
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
  cdCaseFrame: {
    alignItems: "center",
    justifyContent: "center",
  },
  cdCaseBackdropWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 14,
  },
  cdCaseBackdrop: {
    borderRadius: 14,
  },
  cdCaseImage: {
    maxWidth: "100%",
    maxHeight: "100%",
  },
});
