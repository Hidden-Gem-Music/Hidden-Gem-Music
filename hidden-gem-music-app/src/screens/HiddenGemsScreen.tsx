import { LinearGradient } from "expo-linear-gradient";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  TextStyle,
  ViewStyle,
} from "react-native";

import { Country, Song } from "../types/content";
import { CdCaseArt } from "../components/CdCaseArt";
import { ExplicitIndicator } from "../components/ExplicitIndicator";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { getCachedHiddenGemsPage, loadCountryProfile, loadHiddenGemsPage } from "../data/countryApi";
import { hasKnownSongTitle, mapApiCountryProfile, mapApiHiddenGemPage } from "../data/apiMappers";
import { useLoadingText } from "../hooks/useLoadingText";
import { ApiHiddenGemResponse } from "../types/api";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  isActive?: boolean;
  country: Country;
  countries: Country[];
  availableYears: number[];
  onSelectCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
  onSetLoading?: (loading: boolean) => void;
  showNavIntro?: boolean;
  onDismissNavIntro?: () => void;
  focusSelection?: {
    countryId?: string;
    requestKey?: string;
    songTitle?: string;
    artist?: string;
    previewIndex?: number;
    deezerTrackId?: number;
  } | null;
  onFocusSelectionHandled?: () => void;
};

const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const controlButtonGradient = [colors.backgroundRaised, colors.backgroundRaised, colors.navGradient] as const;
const controlButtonPressedGradient = [colors.background, colors.background, colors.backgroundBottom] as const;
const popupBottomDepthGradient = ["rgba(108,119,142,0)", "rgba(108,119,142,0.12)", "rgba(108,119,142,0.3)"] as const;
const cdCaseSource = require("../assets/images/CD-Case-Transparent-Image.png");
const rowBackdropColors = ["#B86A72", "#8B9BC0", "#8B5E7A", "#627F8A", "#C28C5E", "#7A7EB0"];
const hiddenGemsPageSize = 13;
const CD_ART_LEFT_RATIO = 64 / 680;
const CD_ART_TOP_RATIO = 32 / 680;
const CD_ART_SIZE_RATIO = 608 / 680;

type FavoriteArtistPreview = {
  artist: string;
  songTitle: string;
  artistImageUrl?: string;
};

function getSongReleaseLabel(releaseDate: string | undefined, fallbackYear: number) {
  const trimmed = releaseDate?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : `${fallbackYear}`;
}

function formatRecordTypeLabel(recordType: string | undefined) {
  const trimmed = recordType?.trim();
  if (!trimmed) {
    return "Unknown";
  }

  if (trimmed.toLowerCase() === "ep") {
    return "EP";
  }

  return trimmed
    .split(/[\s_-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatExplicitValue(value: boolean | undefined) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return "Unknown";
}

function songHasExplicitBadge(song: Pick<Song, "explicitLyrics" | "explicitContentCover">) {
  return Boolean(song.explicitLyrics || song.explicitContentCover);
}

function getExplicitTooltip(song: Pick<Song, "explicitLyrics" | "explicitContentCover">) {
  const details: string[] = [];
  if (song.explicitLyrics) {
    details.push("Explicit song lyrics");
  }
  if (song.explicitContentCover) {
    details.push("Explicit album art");
  }
  return details.length > 0 ? details.join(" | ") : "Explicit content";
}

function safePausePreview(player: { pause: () => void }) {
  try {
    player.pause();
  } catch {
    // Native audio objects can already be disposed during fast navigation/unmount.
  }
}

function safeReplacePreview(player: { replace: (source: string) => void }, source: string) {
  try {
    player.replace((Platform.OS === "web" ? source : ({ uri: source } as any)) as any);
  } catch {
    // Fail soft if the player rejects the new source during a fast screen transition.
  }
}

function safePlayPreview(player: { play: () => void }) {
  try {
    player.play();
  } catch {
    // Fail soft if the native player is not ready yet.
  }
}

function createLoadingHiddenGemSongs(countryCode: string, year: number, count = hiddenGemsPageSize): Song[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${countryCode}-${year}-loading-${index + 1}`,
    title: "Loading...",
    artist: "Loading...",
    album: "Loading...",
    albumArtUrl: undefined,
    artistImageUrl: undefined,
    explicitLyrics: undefined,
    explicitContentCover: undefined,
    albumExplicitLyrics: undefined,
    releaseDate: undefined,
    recordType: undefined,
    contributors: undefined,
    artistAlbumCount: undefined,
    tracklist: undefined,
    genres: ["Loading..."],
    languages: ["Coming Soon"],
    year,
    duration: "",
    description: "Loading...",
    spotifySearchUrl: "",
  }));
}

function normalizeHiddenGemResponse(response: ApiHiddenGemResponse | null | undefined, fallbackPage: number) {
  return {
    items: Array.isArray(response?.items) ? response.items : [],
    page: typeof response?.page === "number" ? response.page : fallbackPage,
    pageSize: typeof response?.pageSize === "number" ? response.pageSize : hiddenGemsPageSize,
    totalCount: typeof response?.totalCount === "number" ? response.totalCount : 0,
    hasMore: Boolean(response?.hasMore),
  };
}

function buildHiddenGemSongsFromResponse(response: ApiHiddenGemResponse | null | undefined, countryCode: string, year: number, fallbackPage: number) {
  const safeResponse = normalizeHiddenGemResponse(response, fallbackPage);
  const mapped = mapApiHiddenGemPage(safeResponse);
  const seen = new Set<string>();

  return {
    songs: mapped.items
      .map((item, index) => ({
        id: `${countryCode}-${year}-page-${safeResponse.page}-${index + 1}`,
        title: item.title,
        artist: item.artist,
        album: item.album,
        deezerTrackId: item.deezerTrackId,
        deezerAlbumId: item.deezerAlbumId,
        deezerArtistId: item.deezerArtistId,
        albumArtUrl: item.albumArtUrl,
        artistImageUrl: item.artistImageUrl,
        explicitLyrics: item.explicitLyrics,
        explicitContentCover: item.explicitContentCover,
        albumExplicitLyrics: item.albumExplicitLyrics,
        releaseDate: item.releaseDate,
        recordType: item.recordType,
        contributors: item.contributors,
        artistAlbumCount: item.artistAlbumCount,
        tracklist: item.tracklist,
        genres:
          Array.isArray(item.genres) && item.genres.length > 0
            ? item.genres
            : item.genre
              ? [item.genre]
              : [],
        languages: [],
        year,
        duration: "",
        description: `Trending in ${item.countriesChartingCount} countries`,
        spotifySearchUrl: item.previewUrl || "",
      }))
      .filter((song) => {
        if (!hasKnownSongTitle(song.title)) {
          return false;
        }

        const dedupeKey =
          typeof song.deezerTrackId === "number"
            ? `track:${song.deezerTrackId}`
            : `${song.title.trim().toLowerCase()}::${song.artist.trim().toLowerCase()}`;
        if (seen.has(dedupeKey)) {
          return false;
        }
        seen.add(dedupeKey);
        return true;
      }),
    hasNextPage: safeResponse.hasMore,
    totalPages: Math.max(1, Math.ceil(safeResponse.totalCount / safeResponse.pageSize)),
    totalCount: safeResponse.totalCount,
  };
}

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
  artImageUrl,
  showPlayButton,
}: {
  color: string;
  artImageUrl?: string;
  showPlayButton: boolean;
}) {
  const artSize = Math.round(54 * CD_ART_SIZE_RATIO);
  const left = Math.round(54 * CD_ART_LEFT_RATIO);
  const top = Math.round(54 * CD_ART_TOP_RATIO);

  return (
    <View style={styles.miniCdCaseFrame}>
      <View style={[styles.miniCdCaseBackdrop, { left, top, width: artSize, height: artSize, backgroundColor: color }]}>
        {artImageUrl ? <Image source={{ uri: artImageUrl }} style={styles.miniCdCaseBackdropImage} resizeMode="cover" /> : null}
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

function BlankCdCase({
  size = 450,
  loading = false,
  artImageUrl,
}: {
  size?: number;
  loading?: boolean;
  artImageUrl?: string;
}) {
  return <CdCaseArt size={size} placeholderColor="rgb(108,119,142)" artImageUrl={artImageUrl} loading={loading} />;
}

function PlayGlyph() {
  return (
    <View style={styles.playGlyph}>
      <View style={styles.playGlyphTriangleOuter} />
      <View style={styles.playGlyphTriangleInner} />
    </View>
  );
}

function PauseGlyph() {
  return (
    <View style={styles.pauseGlyph}>
      <View style={styles.pauseGlyphBarOuter}>
        <View style={styles.pauseGlyphBarInner} />
      </View>
      <View style={styles.pauseGlyphBarOuter}>
        <View style={styles.pauseGlyphBarInner} />
      </View>
    </View>
  );
}

function PlayerControlButton({
  icon,
  primary = false,
  onPress,
  disabled = false,
  loading = false,
}: {
  icon: ReactNode;
  primary?: boolean;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const showGradient = !disabled && (isHovered || isPressed);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => {
        if (!disabled) {
          setIsHovered(true);
        }
      }}
      onHoverOut={() => setIsHovered(false)}
      onPressIn={() => {
        if (!disabled) {
          setIsPressed(true);
        }
      }}
      onPressOut={() => setIsPressed(false)}
      style={[
        primary ? styles.mainCdControlButtonPrimary : styles.mainCdControlButton,
        disabled ? styles.mainCdControlButtonDisabled : null,
      ]}
    >
      {showGradient ? (
        <LinearGradient
          colors={isPressed ? controlButtonPressedGradient : hoverGradient}
          locations={[0, 0.34, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.mainCdControlFill}
        />
      ) : null}
      <View style={[styles.mainCdControlInner, showGradient ? styles.mainCdControlInnerActive : null]}>
        {icon}
        {loading ? (
          <View style={styles.mainCdControlSpinnerOverlay}>
            <ActivityIndicator size={primary ? 28 : 20} color={colors.textLight} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function HiddenSongListPanel({
  songs,
  selectedSongId,
  onSelectSong,
  onPlaySong,
  isLoading,
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
  isLoading: boolean;
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  const scrollbar = useCustomScrollbar();
  const loadingText = useLoadingText(isLoading);
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
              onPress={() => {
                if (!isLoading) {
                  onSelectSong(song.id);
                }
              }}
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
                          <Text style={[styles.songRowTitle, showGradient ? styles.songTextActive : null]}>
                            {isLoading ? loadingText : song.title}
                          </Text>
                        </View>
                        <Text style={[styles.songRowArtist, showGradient ? styles.songTextActive : null]}>
                          {isLoading ? loadingText : song.artist}
                        </Text>
                      </View>
                      <View style={styles.songArtMetaWrap}>
                        {!isLoading && songHasExplicitBadge(song) ? (
                          <View style={styles.songExplicitBadgeWrap}>
                            <ExplicitIndicator tooltip={getExplicitTooltip(song)} />
                          </View>
                        ) : null}
                        <Pressable
                          style={styles.miniCdHoverTarget}
                          onHoverIn={() => setHoveredMiniCdSongId(song.id)}
                          onHoverOut={() => setHoveredMiniCdSongId((current) => (current === song.id ? null : current))}
                          onPress={(event) => {
                            (event as any)?.stopPropagation?.();
                            if (!isLoading) {
                              onPlaySong(song.id);
                            }
                          }}
                        >
                          <MiniCdCase
                            color={rowBackdropColors[index % rowBackdropColors.length]}
                            artImageUrl={isLoading ? undefined : song.albumArtUrl}
                            showPlayButton={!isLoading && hoveredMiniCdSongId === song.id}
                          />
                        </Pressable>
                      </View>
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
  artists: FavoriteArtistPreview[];
  useLoadingLabels?: boolean;
}) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const [isDraggingArtistScrollbar, setIsDraggingArtistScrollbar] = useState(false);
  const [hoveredArtistIndex, setHoveredArtistIndex] = useState<number | null>(null);
  const trackRef = useRef<View>(null);
  const artistRows = Array.from({ length: 8 }, (_, index) => artists[index] ?? null);
  const artistCdSize = Platform.OS === "web" ? (width < 1160 ? 92 : width < 1360 ? 100 : 108) : 96;
  const artistItemWidth = Platform.OS === "web" ? (width < 1160 ? 112 : width < 1360 ? 124 : 136) : 112;
  const artistGap = Platform.OS === "web" ? (width < 1160 ? 12 : 16) : 10;
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
          contentContainerStyle={[
            styles.favoriteArtistsRow,
            { gap: artistGap },
            Platform.OS === "web" && !artistOverflow ? styles.favoriteArtistsRowExpanded : null,
          ]}
          onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
          onContentSizeChange={(width) => setContentWidth(width)}
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => setScrollX(event.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
        >
            {artistRows.map((artist, index) => (
              <Pressable
                key={`${artist?.artist ?? "loading"}-${artist?.songTitle ?? index}-${index}`}
                onHoverIn={() => setHoveredArtistIndex(index)}
                onHoverOut={() => setHoveredArtistIndex((current) => (current === index ? null : current))}
                style={({ pressed }) => [
                styles.favoriteArtistItem,
                { width: artistItemWidth },
                hoveredArtistIndex === index || pressed ? styles.favoriteArtistItemActive : null,
              ]}
              >
                <View style={[styles.favoriteArtistCdWrap, { width: artistCdSize, height: artistCdSize + 18 }]}>
                {hoveredArtistIndex === index || useLoadingLabels ? (
                  <View
                    style={[
                      styles.favoriteArtistCdShadow,
                      { width: artistCdSize, height: artistCdSize, marginLeft: -(artistCdSize / 2) },
                    ]}
                  />
                ) : null}
                <CdCaseArt
                  size={artistCdSize}
                  placeholderColor={rowBackdropColors[index % rowBackdropColors.length]}
                  artImageUrl={useLoadingLabels ? undefined : artist?.artistImageUrl}
                  loading={useLoadingLabels}
                />
                </View>
              <Text style={styles.favoriteArtistName}>{useLoadingLabels ? "Loading..." : artist?.artist ?? ""}</Text>
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
    </Panel>
  );
}

function PlayingSidePanel({
  selectedSong,
  hasPreviousSong,
  hasNextSong,
  isPlayingPreview,
  isPreviewBuffering,
  isLoading,
  onTogglePreview,
  onPreviousSong,
  onNextSong,
}: {
  selectedSong: Song;
  hasPreviousSong: boolean;
  hasNextSong: boolean;
  isPlayingPreview: boolean;
  isPreviewBuffering: boolean;
  isLoading: boolean;
  onTogglePreview: () => void;
  onPreviousSong: () => void;
  onNextSong: () => void;
}) {
  const { width } = useWindowDimensions();
  const isNativePlatform = Platform.OS !== "web";
  const mainCdSize = isNativePlatform || width < 980 ? 325 : 450;
  const scrollbar = useCustomScrollbar();
  const loadingText = useLoadingText(isLoading);
  const disablePrevious = isLoading || !hasPreviousSong;
  const disableNext = isLoading || !hasNextSong;

  return (
    <Panel style={[styles.secondaryPanel, styles.playingPanel]}>
      <SecondarySurfaceFill />
      <View style={styles.secondaryPanelScrollFrame}>
        <ScrollView
          ref={scrollbar.scrollRef}
          style={styles.secondaryPanelScroll}
          contentContainerStyle={[styles.playingSideContent, isNativePlatform ? styles.playingSideContentNative : null]}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => scrollbar.setViewportHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => scrollbar.setContentHeight(height)}
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => scrollbar.setScrollY(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          <View style={styles.blankCdCaseWrap}>
            <View style={[styles.mainCdHoverTarget, { width: mainCdSize, height: mainCdSize }]}>
              <BlankCdCase size={mainCdSize} loading={isLoading} artImageUrl={isLoading ? undefined : selectedSong.albumArtUrl} />
            </View>
            <View style={[styles.mainCdControlsRow, isNativePlatform ? styles.mainCdControlsRowNative : null]}>
              <PlayerControlButton
                disabled={disablePrevious}
                onPress={onPreviousSong}
                icon={<GemIcon size={isNativePlatform ? 18 : 22} style={styles.mainCdControlGemLeft} />}
              />
              <PlayerControlButton
                primary
                onPress={onTogglePreview}
                loading={isPreviewBuffering}
                icon={isPlayingPreview ? <PauseGlyph /> : <PlayGlyph />}
              />
              <PlayerControlButton
                disabled={disableNext}
                onPress={onNextSong}
                icon={<GemIcon size={isNativePlatform ? 18 : 22} style={styles.mainCdControlGemRight} />}
              />
            </View>
          </View>

          <View style={styles.playingSongLineWrap}>
            <Text numberOfLines={1} style={styles.playingSongLine}>
              <Text style={styles.playingSongName}>{isLoading ? loadingText : selectedSong.title}</Text>
              {"\u00A0\u00A0"}
              <Text style={styles.playingSongBy}>by</Text>
              {"  "}
              <Text style={styles.playingSongArtistInline}>{isLoading ? loadingText : selectedSong.artist}</Text>
            </Text>
            {!isLoading && songHasExplicitBadge(selectedSong) ? (
              <View style={styles.playingSongExplicitWrap}>
                <ExplicitIndicator tooltip={getExplicitTooltip(selectedSong)} />
              </View>
            ) : null}
          </View>
          <View style={styles.playingSongUnderline} />

          <View style={styles.playingMetaBlock}>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Album Name: </Text>
                <Text style={styles.playingMetaValue}>{isLoading ? loadingText : selectedSong.album}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Genre(s): </Text>
                <Text style={styles.playingMetaValue}>
                  {isLoading ? loadingText : selectedSong.genres.length > 0 ? selectedSong.genres.join(", ") : "Unknown"}
                </Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Release Date: </Text>
                <Text style={styles.playingMetaValue}>{isLoading ? loadingText : getSongReleaseLabel(selectedSong.releaseDate, selectedSong.year)}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>{`Released Albums by ${isLoading ? "Artist Name" : selectedSong.artist}: `}</Text>
                <Text style={styles.playingMetaValue}>
                  {isLoading ? loadingText : typeof selectedSong.artistAlbumCount === "number" ? `${selectedSong.artistAlbumCount}` : "Unknown"}
                </Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Record Type: </Text>
                <Text style={styles.playingMetaValue}>{isLoading ? loadingText : formatRecordTypeLabel(selectedSong.recordType)}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Contributors: </Text>
                <Text style={styles.playingMetaValue}>
                  {isLoading ? loadingText : selectedSong.contributors && selectedSong.contributors.length > 0 ? selectedSong.contributors.join(", ") : "Unknown"}
                </Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Language(s): </Text>
                <Text style={styles.playingMetaValue}>{isLoading ? "Coming Soon" : selectedSong.languages.join(", ")}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Explicit Lyrics in Song: </Text>
                <Text style={styles.playingMetaValue}>{isLoading ? loadingText : formatExplicitValue(selectedSong.explicitLyrics)}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Explicit Lyrics in Album: </Text>
                <Text style={styles.playingMetaValue}>{isLoading ? loadingText : formatExplicitValue(selectedSong.albumExplicitLyrics)}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Explicit Album Art: </Text>
                <Text style={styles.playingMetaValue}>{isLoading ? loadingText : formatExplicitValue(selectedSong.explicitContentCover)}</Text>
              </Text>
            </View>
            <View style={styles.playingMetaCard}>
              <Text style={styles.playingMetaLine}>
                <Text style={styles.playingMetaLabel}>Album Tracklist:</Text>
              </Text>
              {isLoading ? (
                <Text style={styles.playingMetaValue}>{loadingText}</Text>
              ) : selectedSong.tracklist && selectedSong.tracklist.length > 0 ? (
                selectedSong.tracklist.map((trackName, index) => (
                  <Text key={`${selectedSong.id}-track-${index}`} style={styles.playingTracklistLine}>
                    <Text style={styles.playingTracklistNumber}>{`${index + 1}. `}</Text>
                    <Text style={styles.playingMetaValue}>{trackName}</Text>
                  </Text>
                ))
              ) : (
                <Text style={styles.playingMetaValue}>Tracklist unavailable.</Text>
              )}
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
  isActive = true,
  country,
  countries,
  availableYears,
  onSelectCountry,
  selectedYear,
  onChangeYear,
  onSetLoading,
  showNavIntro = false,
  onDismissNavIntro,
  focusSelection = null,
  onFocusSelectionHandled,
}: Props) {
  const { width } = useWindowDimensions();
  const isNativePlatform = Platform.OS !== "web";
  const isStacked = isNativePlatform;
  const isBlurbStacked = isNativePlatform || width < 1380;
  const [apiProfile, setApiProfile] = useState<ReturnType<typeof mapApiCountryProfile> | null>(null);
  const [apiSongs, setApiSongs] = useState<Song[] | null>(null);
  const [isSongsLoading, setIsSongsLoading] = useState(showNavIntro);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHiddenGemsCount, setTotalHiddenGemsCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pendingPageStep, setPendingPageStep] = useState<null | { direction: -1 | 1; keepPlaying: boolean }>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const hiddenGemSongs = useMemo(() => apiSongs ?? [], [apiSongs]);
  const [activeSongId, setActiveSongId] = useState<string>(() => hiddenGemSongs[0]?.id || "");
  const safeSelectedSong = hiddenGemSongs.find((song) => song.id === activeSongId) ?? hiddenGemSongs[0];
  const [previewSongId, setPreviewSongId] = useState<string>(safeSelectedSong?.id ?? "");
  const [shouldPreviewPlay, setShouldPreviewPlay] = useState(false);
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
  const filterDropdownRef = useRef<View>(null);
  const countryDropdownRef = useRef<View>(null);
  const yearDropdownRef = useRef<View>(null);
  const initializedFocusSelectionKeyRef = useRef("");
  const [introCountryId, setIntroCountryId] = useState<string | null>(null);
  const [introYear, setIntroYear] = useState<number | null>(null);
  const [isIntroCountryDropdownOpen, setIsIntroCountryDropdownOpen] = useState(false);
  const [isIntroYearDropdownOpen, setIsIntroYearDropdownOpen] = useState(false);
  const [hoveredIntroCountryId, setHoveredIntroCountryId] = useState<string | null>(null);
  const [hoveredIntroYear, setHoveredIntroYear] = useState<number | null>(null);
  const [isIntroCountryDropdownHovered, setIsIntroCountryDropdownHovered] = useState(false);
  const [isIntroCountryDropdownPressed, setIsIntroCountryDropdownPressed] = useState(false);
  const [isIntroYearDropdownHovered, setIsIntroYearDropdownHovered] = useState(false);
  const [isIntroYearDropdownPressed, setIsIntroYearDropdownPressed] = useState(false);
  const [isIntroDiscoverHovered, setIsIntroDiscoverHovered] = useState(false);
  const [isIntroDiscoverPressed, setIsIntroDiscoverPressed] = useState(false);
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
  const showIntroCountryDropdownGradient =
    isIntroCountryDropdownHovered || isIntroCountryDropdownPressed || isIntroCountryDropdownOpen;
  const showIntroYearDropdownGradient = isIntroYearDropdownHovered || isIntroYearDropdownPressed || isIntroYearDropdownOpen;
  const showFilterButtonGradient = isFiltersOpen || isFilterButtonHovered || isFilterButtonPressed;
  const introCountryLabel = countryOptions.find((item) => item.id === introCountryId)?.name ?? "Select Country";
  const fallbackSong: Song = {
    id: `${country.code}-${selectedYear}-placeholder`,
    title: "Loading...",
    artist: "Loading...",
    album: "Loading...",
    explicitLyrics: undefined,
    explicitContentCover: undefined,
    albumExplicitLyrics: undefined,
    recordType: undefined,
    contributors: undefined,
    artistAlbumCount: undefined,
    tracklist: undefined,
    genres: ["Loading..."],
    languages: ["Loading..."],
    year: selectedYear,
    duration: "",
    description: "",
    spotifySearchUrl: "",
  };
  const selectedSong = safeSelectedSong ?? fallbackSong;
  const previewSong = hiddenGemSongs.find((song) => song.id === previewSongId) ?? null;
  const previewUrl = previewSong?.spotifySearchUrl?.trim() ?? "";
  const previewPlayer = useAudioPlayer(null, { updateInterval: 200 });
  const previewStatus = useAudioPlayerStatus(previewPlayer);
  const isPreviewPlaying = previewSongId === selectedSong.id && previewStatus.playing;
  const isPreviewBuffering =
    previewSongId === selectedSong.id &&
    Boolean(previewUrl) &&
    shouldPreviewPlay &&
    !previewStatus.playing;
  const shouldShowNavIntro = showNavIntro;
  const isScreenLoading = shouldShowNavIntro || isSongsLoading;
  const displayCountryName = shouldShowNavIntro ? "Loading..." : country.name;
  const displayHiddenGemCount = shouldShowNavIntro || totalHiddenGemsCount == null ? "Loading..." : `${totalHiddenGemsCount}`;
  const focusSelectionKey = useMemo(() => {
    if (!focusSelection) {
      return "";
    }

    const focusCountryId = String(focusSelection.countryId ?? "").trim().toLowerCase();
    const requestKey = String(focusSelection.requestKey ?? "").trim();
    const deezerTrackId = typeof focusSelection.deezerTrackId === "number" ? `${focusSelection.deezerTrackId}` : "";
    const songTitle = String(focusSelection.songTitle ?? "").trim().toLowerCase();
    const artist = String(focusSelection.artist ?? "").trim().toLowerCase();
    if (deezerTrackId) {
      return `${focusCountryId}::${requestKey}::track::${deezerTrackId}`;
    }
    return songTitle && artist ? `${focusCountryId}::${requestKey}::${songTitle}||${artist}` : "";
  }, [focusSelection]);

  useEffect(() => {
    if (!shouldShowNavIntro) {
      return;
    }
    setIntroCountryId(null);
    setIntroYear(null);
    setIsIntroCountryDropdownOpen(false);
    setIsIntroYearDropdownOpen(false);
    setHoveredIntroCountryId(null);
    setHoveredIntroYear(null);
  }, [country.id, selectedYear, shouldShowNavIntro]);

  useEffect(() => {
    setPage(1);
    setPendingPageStep(null);
  }, [country.code, selectedYear]);

  useEffect(() => {
    if (!focusSelectionKey) {
      initializedFocusSelectionKeyRef.current = "";
      return;
    }

    const targetCountryId = String(focusSelection?.countryId ?? "")
      .trim()
      .toLowerCase();
    const matchesTargetCountry =
      !targetCountryId ||
      targetCountryId === country.id.trim().toLowerCase() ||
      targetCountryId === country.code.trim().toLowerCase();
    if (!matchesTargetCountry) {
      return;
    }

    if (initializedFocusSelectionKeyRef.current === focusSelectionKey) {
      return;
    }

    initializedFocusSelectionKeyRef.current = focusSelectionKey;

    if (page !== 1) {
      setPage(1);
    }
  }, [country.code, country.id, focusSelection?.countryId, focusSelectionKey, page]);

  useEffect(() => {
    if (!isActive || shouldShowNavIntro) {
      setApiProfile(null);
      return;
    }
    const controller = new AbortController();
    loadCountryProfile(country.code, selectedYear, controller.signal)
      .then((profilePayload) => {
        setApiProfile(mapApiCountryProfile(profilePayload));
      })
      .catch(() => {
        if (!(controller.signal.aborted)) {
          setApiProfile(null);
        }
      });

    return () => {
      controller.abort();
    };
  }, [country.code, isActive, selectedYear, shouldShowNavIntro]);

  useEffect(() => {
    if (!isActive) {
      onSetLoading?.(false);
      return;
    }

    if (shouldShowNavIntro) {
      setApiSongs(createLoadingHiddenGemSongs(country.code, selectedYear));
      setIsSongsLoading(true);
      setHasNextPage(false);
      setTotalPages(1);
      setTotalHiddenGemsCount(null);
      onSetLoading?.(false);
      return;
    }

    const cachedResponse = getCachedHiddenGemsPage(country.code, selectedYear, 2, page, hiddenGemsPageSize);
    if (cachedResponse) {
      const cachedPage = buildHiddenGemSongsFromResponse(cachedResponse, country.code, selectedYear, page);
      setApiSongs(cachedPage.songs);
      setHasNextPage(cachedPage.hasNextPage);
      setTotalPages(cachedPage.totalPages);
      setTotalHiddenGemsCount(cachedPage.totalCount);
      setIsSongsLoading(false);
      onSetLoading?.(false);
      return;
    }

    const controller = new AbortController();
    setApiSongs(createLoadingHiddenGemSongs(country.code, selectedYear));
    setIsSongsLoading(true);
    onSetLoading?.(true);
    loadHiddenGemsPage(country.code, selectedYear, 2, page, hiddenGemsPageSize, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }
        const nextPage = buildHiddenGemSongsFromResponse(response, country.code, selectedYear, page);
        setApiSongs(nextPage.songs);
        setHasNextPage(nextPage.hasNextPage);
        setTotalPages(nextPage.totalPages);
        setTotalHiddenGemsCount(nextPage.totalCount);
        setIsSongsLoading(false);
        onSetLoading?.(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setApiSongs([]);
          setHasNextPage(false);
          setTotalPages(1);
          setTotalHiddenGemsCount(null);
          setIsSongsLoading(false);
          onSetLoading?.(false);
        }
      });

    return () => {
      controller.abort();
      onSetLoading?.(false);
    };
  }, [country.code, isActive, onSetLoading, page, selectedYear, shouldShowNavIntro]);

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

  useEffect(() => {
    if (!previewSongId) {
      return;
    }

    if (hiddenGemSongs.some((song) => song.id === previewSongId)) {
      return;
    }

    setPreviewSongId("");
    setShouldPreviewPlay(false);
  }, [hiddenGemSongs, previewSongId]);

  useEffect(() => {
    if (!pendingPageStep || hiddenGemSongs.length === 0) {
      return;
    }

    const targetSong = pendingPageStep.direction === 1 ? hiddenGemSongs[0] : hiddenGemSongs[hiddenGemSongs.length - 1];
    if (!targetSong) {
      return;
    }

    setActiveSongId(targetSong.id);
    setPreviewSongId(targetSong.id);
    setShouldPreviewPlay(pendingPageStep.keepPlaying);
    setPendingPageStep(null);
  }, [hiddenGemSongs, pendingPageStep]);

  useEffect(() => {
    if (!focusSelection || isSongsLoading) {
      return;
    }

    const targetCountryId = String(focusSelection.countryId ?? "")
      .trim()
      .toLowerCase();
    const matchesTargetCountry =
      !targetCountryId ||
      targetCountryId === country.id.trim().toLowerCase() ||
      targetCountryId === country.code.trim().toLowerCase();
    if (!matchesTargetCountry) {
      return;
    }

    if (hiddenGemSongs.length === 0) {
      return;
    }

    const usingPlaceholderSongs = hiddenGemSongs.every(
      (song) => song.title === "Loading..." || song.id.includes("-loading-")
    );
    if (usingPlaceholderSongs) {
      return;
    }

    const wantedPreviewIndex =
      typeof focusSelection.previewIndex === "number" && Number.isFinite(focusSelection.previewIndex)
        ? Math.trunc(focusSelection.previewIndex)
        : -1;
    const wantedSong = String(focusSelection.songTitle ?? "").trim().toLowerCase();
    const wantedArtist = String(focusSelection.artist ?? "").trim().toLowerCase();
    const wantedTrackId = typeof focusSelection.deezerTrackId === "number" ? focusSelection.deezerTrackId : undefined;
    if (!wantedSong || !wantedArtist) {
      if (typeof wantedTrackId !== "number" && wantedPreviewIndex < 0) {
        return;
      }
    }

    const normalizeSongMatchText = (value: string) =>
      value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/gi, " ")
        .trim()
        .toLowerCase();

    const normalizedWantedSong = normalizeSongMatchText(wantedSong);
    const normalizedWantedArtist = normalizeSongMatchText(wantedArtist);

    const matchedSong = hiddenGemSongs.find((song) => {
      if (typeof wantedTrackId === "number" && song.deezerTrackId === wantedTrackId) {
        return true;
      }

      const songTitle = normalizeSongMatchText(song.title);
      const songArtist = normalizeSongMatchText(song.artist);
      if (!songTitle || !songArtist) {
        return false;
      }

      return songTitle === normalizedWantedSong && songArtist === normalizedWantedArtist;
    });

    if (matchedSong) {
      setActiveSongId(matchedSong.id);
      setPreviewSongId(matchedSong.id);
      onFocusSelectionHandled?.();
      return;
    }

    if (page === 1 && wantedPreviewIndex >= 0 && wantedPreviewIndex < hiddenGemSongs.length) {
      const indexedSong = hiddenGemSongs[wantedPreviewIndex];
      if (indexedSong) {
        setActiveSongId(indexedSong.id);
        setPreviewSongId(indexedSong.id);
        onFocusSelectionHandled?.();
        return;
      }
    }

    if (hasNextPage) {
      beginPageTransition(page + 1);
      return;
    }

    onFocusSelectionHandled?.();
  }, [country.code, country.id, focusSelection, hiddenGemSongs, isSongsLoading, hasNextPage, onFocusSelectionHandled, page]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch(() => {
      // Preview playback should fail soft if the platform ignores audio mode changes.
    });

    return () => {
      safePausePreview(previewPlayer);
    };
  }, [previewPlayer]);

  useEffect(() => {
    if (!previewSongId || !previewUrl) {
      safePausePreview(previewPlayer);
      if (shouldPreviewPlay) {
        setShouldPreviewPlay(false);
      }
      return;
    }

    safeReplacePreview(previewPlayer, previewUrl);
    if (shouldPreviewPlay) {
      safePlayPreview(previewPlayer);
    } else {
      safePausePreview(previewPlayer);
    }
  }, [previewPlayer, previewSongId, previewUrl, shouldPreviewPlay]);

  useEffect(() => {
    if (previewStatus.didJustFinish) {
      setShouldPreviewPlay(false);
      previewPlayer.seekTo(0).catch(() => {
        // Ignore seek reset failures and leave the preview paused.
      });
    }
  }, [previewPlayer, previewStatus.didJustFinish]);

  useEffect(() => {
    if (Platform.OS !== "web" || (!isFiltersOpen && !isCountryDropdownOpen && !isYearDropdownOpen) || typeof document === "undefined") {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      const clickedInsideFilter = Boolean((filterDropdownRef.current as any)?.contains?.(targetNode));
      const clickedInsideCountry = Boolean((countryDropdownRef.current as any)?.contains?.(targetNode));
      const clickedInsideYear = Boolean((yearDropdownRef.current as any)?.contains?.(targetNode));

      if (!clickedInsideFilter && !clickedInsideCountry && !clickedInsideYear) {
        setIsFiltersOpen(false);
        setIsCountryDropdownOpen(false);
        setIsYearDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [isCountryDropdownOpen, isFiltersOpen, isYearDropdownOpen]);

  const favoriteArtists = useMemo(() => {
    if (!apiProfile) {
      return [];
    }

    const selectedArtists: FavoriteArtistPreview[] = [];
    const seen = new Set<string>();
    const addArtist = (name: string, songTitle: string, artistImageUrl?: string) => {
      const normalized = name.trim().toLowerCase();
      if (!normalized || seen.has(normalized) || selectedArtists.length >= 8) {
        return;
      }

      seen.add(normalized);
      selectedArtists.push({ artist: name, songTitle, artistImageUrl });
    };

    apiProfile.topUniqueSongs.forEach((song) => addArtist(song.artist, song.title, song.artistImageUrl));
    if (selectedArtists.length < 8) {
      apiProfile.topSharedSongs.forEach((song) => addArtist(song.artist, song.title, song.artistImageUrl));
    }

    return selectedArtists;
  }, [apiProfile]);

  const selectedSongIndex = hiddenGemSongs.findIndex((song) => song.id === selectedSong.id);
  const hasPreviousSong = selectedSongIndex > 0 || page > 1;
  const hasNextSong = selectedSongIndex >= 0 && (selectedSongIndex < hiddenGemSongs.length - 1 || hasNextPage);

  const setSongSelection = (songId: string) => {
    setActiveSongId(songId);
  };

  const beginPageTransition = (nextPage: number, pendingStep?: { direction: -1 | 1; keepPlaying: boolean }) => {
    setPendingPageStep(pendingStep ?? null);
    setApiSongs(createLoadingHiddenGemSongs(country.code, selectedYear));
    setIsSongsLoading(true);
    onSetLoading?.(true);
    setPage(nextPage);
  };

  const selectSongAndAutoPlay = (songId: string) => {
    setSongSelection(songId);
    setPreviewSongId(songId);
    setShouldPreviewPlay(true);
  };

  const stepSong = (direction: -1 | 1) => {
    if (!hiddenGemSongs.length || selectedSongIndex < 0) {
      return;
    }
    const nextIndex = selectedSongIndex + direction;
    const shouldKeepPlaying = shouldPreviewPlay && previewSongId === selectedSong.id;
    if (nextIndex < 0 || nextIndex >= hiddenGemSongs.length) {
      if (direction === -1 && page > 1) {
        beginPageTransition(Math.max(1, page - 1), { direction, keepPlaying: shouldKeepPlaying });
      } else if (direction === 1 && hasNextPage) {
        beginPageTransition(page + 1, { direction, keepPlaying: shouldKeepPlaying });
      }
      return;
    }
    const nextSong = hiddenGemSongs[nextIndex];
    if (!nextSong) {
      return;
    }
    setSongSelection(nextSong.id);
    setPreviewSongId(nextSong.id);
    setShouldPreviewPlay(shouldKeepPlaying);
  };

  const toggleSelectedSongPreview = () => {
    if (previewSongId !== selectedSong.id) {
      setPreviewSongId(selectedSong.id);
      setShouldPreviewPlay(true);
      return;
    }
    if (shouldPreviewPlay) {
      setShouldPreviewPlay(false);
      safePausePreview(previewPlayer);
      return;
    }
    if (previewStatus.didJustFinish) {
      previewPlayer.seekTo(0).catch(() => {
        // Ignore restart seek failures and let play attempt proceed.
      });
    }
    setShouldPreviewPlay(true);
  };

  return (
    <ScreenScaffold alwaysScrollableOnWeb disableScroll={shouldShowNavIntro}>
      <View
        style={[styles.pageFrame, shouldShowNavIntro && isNativePlatform ? styles.pageFrameHiddenBehindIntro : null]}
        pointerEvents={shouldShowNavIntro ? "none" : "auto"}
      >
        <Panel style={styles.blurbPanel}>
          <LinearGradient
            colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.42)", "rgba(66,72,101,0.72)"]}
            locations={[0, 0.42, 0.78, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
              style={styles.blurbFill}
          />
          <View style={[styles.blurbContent, isBlurbStacked ? styles.blurbContentStacked : null]}>
            <View
              style={[
                styles.blurbCopy,
                !isBlurbStacked ? styles.blurbCopyWebReserved : null,
                isBlurbStacked ? styles.blurbCopyStacked : null,
              ]}
            >
              <View style={styles.blurbHeadingRow}>
                <Text style={styles.blurbHeading}>{displayCountryName}&apos;s Hidden Gems</Text>
                <GemIcon size={16} style={styles.blurbIcon} />
              </View>
              <Text style={styles.blurbBody}>
                Hidden gems are songs that are loved in this country, but have not spread as widely
                {isBlurbStacked ? " " : "\n"}across other countries as of your selected year. Select optional
                filter(s), a country, and a year to view that country&apos;s Hidden Gems. Hover over the selected
                song&apos;s CD to view the previous, play, and skip buttons. Click play to listen to a 30-second
                preview of the song.
              </Text>
            </View>
            <View style={[styles.blurbRightRail, isBlurbStacked ? styles.blurbRightRailStacked : null]}>
              <View style={[styles.blurbControlsRow, isBlurbStacked ? styles.blurbControlsRowStacked : null]}>
                <View ref={filterDropdownRef} style={styles.blurbFiltersArea}>
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
                {isFiltersOpen ? (
                  <Panel style={styles.filtersModal}>
                    <SecondarySurfaceFill />
                    <Text style={styles.filtersModalTitle}>All Filters</Text>
                    {/* Genre filters are intentionally commented out for now.
                        The current live genre data is API-fetched per song and is not normalized
                        enough yet to support trustworthy Hidden Gems filtering. Keep this note here
                        for a future normalized-genre iteration instead of deleting it. */}
                    {/* <Text style={styles.filtersModalLine}>Genre(s): Genre info coming soon.</Text> */}
                    <Text style={styles.filtersModalLine}>Language(s): Language info coming soon.</Text>
                  </Panel>
                ) : null}
                </View>
                <View style={styles.blurbDropdownStack}>
                <View ref={countryDropdownRef} style={[styles.blurbYearDropdownWrap, styles.blurbCountryDropdownWrap]}>
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
                      <Text style={styles.blurbYearDropdownText}>
                        {shouldShowNavIntro ? "Loading..." : displayCountryName}
                      </Text>
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
                          const selected = !shouldShowNavIntro && countryOption.id === country.id;
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

                <View ref={yearDropdownRef} style={[styles.blurbYearDropdownWrap, styles.blurbBottomYearDropdownWrap]}>
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
              <View style={styles.blurbStatCardShell}>
                <LinearGradient
                  colors={[colors.backgroundSoft, "#74819B", "#7A4762"]}
                  locations={[0, 0.38, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.blurbStatCardFill}
                />
                <Text style={styles.blurbStatValue}>{displayHiddenGemCount}</Text>
                <Text style={styles.blurbStatLabel}>Hidden Gems</Text>
              </View>
            </View>
          </View>
        </Panel>
        <View style={styles.layout}>
          <View style={[styles.primaryPanelsRow, isStacked ? styles.primaryPanelsRowStacked : null]}>
            {isStacked ? (
              <>
                <View style={[styles.panelColumn, styles.playingPanelColumn, styles.panelColumnStacked]}>
                  <PlayingSidePanel
                    selectedSong={selectedSong}
                    hasPreviousSong={hasPreviousSong}
                    hasNextSong={hasNextSong}
                    isPlayingPreview={shouldPreviewPlay && previewSongId === selectedSong.id}
                    isPreviewBuffering={isPreviewBuffering}
                    isLoading={isScreenLoading}
                    onTogglePreview={toggleSelectedSongPreview}
                    onPreviousSong={() => stepSong(-1)}
                    onNextSong={() => stepSong(1)}
                  />
                </View>
                <View style={[styles.panelColumn, styles.songListPanelColumn, styles.panelColumnStacked]}>
                  <HiddenSongListPanel
                    songs={hiddenGemSongs}
                    selectedSongId={selectedSong.id}
                    onSelectSong={setSongSelection}
                    onPlaySong={selectSongAndAutoPlay}
                    isLoading={isScreenLoading}
                    page={page}
                    totalPages={totalPages}
                    hasPreviousPage={page > 1}
                    hasNextPage={hasNextPage}
                    onPreviousPage={() => beginPageTransition(Math.max(1, page - 1))}
                    onNextPage={() => {
                      if (hasNextPage) {
                        beginPageTransition(page + 1);
                      }
                    }}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={[styles.panelColumn, styles.songListPanelColumn]}>
                  <HiddenSongListPanel
                    songs={hiddenGemSongs}
                    selectedSongId={selectedSong.id}
                    onSelectSong={setSongSelection}
                    onPlaySong={selectSongAndAutoPlay}
                    isLoading={isScreenLoading}
                    page={page}
                    totalPages={totalPages}
                    hasPreviousPage={page > 1}
                    hasNextPage={hasNextPage}
                    onPreviousPage={() => beginPageTransition(Math.max(1, page - 1))}
                    onNextPage={() => {
                      if (hasNextPage) {
                        beginPageTransition(page + 1);
                      }
                    }}
                  />
                </View>
                <View style={[styles.panelColumn, styles.playingPanelColumn]}>
                  <PlayingSidePanel
                    selectedSong={selectedSong}
                    hasPreviousSong={hasPreviousSong}
                    hasNextSong={hasNextSong}
                    isPlayingPreview={shouldPreviewPlay && previewSongId === selectedSong.id}
                    isPreviewBuffering={isPreviewBuffering}
                    isLoading={isScreenLoading}
                    onTogglePreview={toggleSelectedSongPreview}
                    onPreviousSong={() => stepSong(-1)}
                    onNextSong={() => stepSong(1)}
                  />
                </View>
              </>
            )}
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
        <View style={[styles.navIntroOverlay, isNativePlatform ? styles.navIntroOverlayNative : null]}>
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
          <Panel style={[styles.navIntroModal, isNativePlatform ? styles.navIntroModalNative : null]}>
            <LinearGradient
              colors={popupBottomDepthGradient}
              locations={[0, 0.72, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.navIntroModalDepthFill}
            />
            <View style={styles.navIntroModalContent}>
              <Text style={[styles.navIntroTitle, isNativePlatform ? styles.navIntroTitleNative : null]}>Hidden Gems</Text>
              <Text style={[styles.navIntroBody, isNativePlatform ? styles.navIntroBodyNative : null]}>
                To view a country&apos;s hidden gems, select a country and a year. After selecting, you will also be able
                to select a different country and/or year on the top of the page, to further your discovery.
              </Text>
              <View style={[styles.navIntroControls, isNativePlatform ? styles.navIntroControlsNative : null]}>
              <View
                style={[
                  styles.navIntroDropdownWrap,
                  styles.navIntroCountryDropdownWrap,
                  isNativePlatform ? styles.navIntroDropdownWrapNative : null,
                ]}
              >
                <Pressable
                  onPress={() => {
                    setIsIntroCountryDropdownOpen((current) => !current);
                    setIsIntroYearDropdownOpen(false);
                  }}
                  onHoverIn={() => setIsIntroCountryDropdownHovered(true)}
                  onHoverOut={() => setIsIntroCountryDropdownHovered(false)}
                  onPressIn={() => setIsIntroCountryDropdownPressed(true)}
                  onPressOut={() => setIsIntroCountryDropdownPressed(false)}
                  style={styles.blurbYearDropdownShell}
                >
                  {showIntroCountryDropdownGradient ? (
                    <LinearGradient
                      colors={isIntroCountryDropdownPressed ? activeGradient : hoverGradient}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.blurbYearDropdownButtonGradient}
                    />
                  ) : null}
                  <View
                    style={[
                      styles.blurbYearDropdownButton,
                      showIntroCountryDropdownGradient ? styles.blurbYearDropdownButtonActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.blurbYearDropdownText,
                        showIntroCountryDropdownGradient ? styles.blurbYearDropdownTextActive : null,
                        introCountryId == null ? styles.blurbYearDropdownTextPlaceholder : null,
                      ]}
                    >
                      {introCountryLabel}
                    </Text>
                    <Text
                      style={[
                        styles.blurbYearDropdownChevron,
                        showIntroCountryDropdownGradient ? styles.blurbYearDropdownTextActive : null,
                      ]}
                    >
                      {isIntroCountryDropdownOpen ? "-" : "+"}
                    </Text>
                  </View>
                </Pressable>
                {isIntroCountryDropdownOpen ? (
                  <Panel style={[styles.blurbYearDropdownMenu, styles.navIntroCountryDropdownMenu]}>
                    <SecondarySurfaceFill />
                    <ScrollView style={styles.blurbYearDropdownScroll} contentContainerStyle={styles.blurbYearDropdownContent}>
                      {countryOptions.map((countryOption) => {
                        const selected = countryOption.id === introCountryId;
                        const hovered = hoveredIntroCountryId === countryOption.id;
                        const showOptionGradient = selected || hovered;

                        return (
                          <Pressable
                            key={`intro-${countryOption.id}`}
                            onHoverIn={() => setHoveredIntroCountryId(countryOption.id)}
                            onHoverOut={() => setHoveredIntroCountryId((current) => (current === countryOption.id ? null : current))}
                            onPressIn={() => setHoveredIntroCountryId(countryOption.id)}
                            onPress={() => {
                              setIntroCountryId(countryOption.id);
                              setIsIntroCountryDropdownOpen(false);
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
              <View
                style={[
                  styles.navIntroDropdownWrap,
                  styles.navIntroYearDropdownWrap,
                  isNativePlatform ? styles.navIntroDropdownWrapNative : null,
                ]}
              >
                <Pressable
                  onPress={() => {
                    setIsIntroYearDropdownOpen((current) => !current);
                    setIsIntroCountryDropdownOpen(false);
                  }}
                  onHoverIn={() => setIsIntroYearDropdownHovered(true)}
                  onHoverOut={() => setIsIntroYearDropdownHovered(false)}
                  onPressIn={() => setIsIntroYearDropdownPressed(true)}
                  onPressOut={() => setIsIntroYearDropdownPressed(false)}
                  style={styles.blurbYearDropdownShell}
                >
                  {showIntroYearDropdownGradient ? (
                    <LinearGradient
                      colors={isIntroYearDropdownPressed ? activeGradient : hoverGradient}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.blurbYearDropdownButtonGradient}
                    />
                  ) : null}
                  <View
                    style={[
                      styles.blurbYearDropdownButton,
                      showIntroYearDropdownGradient ? styles.blurbYearDropdownButtonActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.blurbYearDropdownText,
                        showIntroYearDropdownGradient ? styles.blurbYearDropdownTextActive : null,
                        introYear == null ? styles.blurbYearDropdownTextPlaceholder : null,
                      ]}
                    >
                      {introYear == null ? "Select Year" : introYear}
                    </Text>
                    <Text
                      style={[
                        styles.blurbYearDropdownChevron,
                        showIntroYearDropdownGradient ? styles.blurbYearDropdownTextActive : null,
                      ]}
                    >
                      {isIntroYearDropdownOpen ? "-" : "+"}
                    </Text>
                  </View>
                </Pressable>
                {isIntroYearDropdownOpen ? (
                  <Panel style={[styles.blurbYearDropdownMenu, styles.navIntroYearDropdownMenu]}>
                    <SecondarySurfaceFill />
                    <ScrollView style={styles.blurbYearDropdownScroll} contentContainerStyle={styles.blurbYearDropdownContent}>
                      {yearOptions.map((year) => {
                        const selected = year === introYear;
                        const hovered = hoveredIntroYear === year;
                        const showOptionGradient = selected || hovered;

                        return (
                          <Pressable
                            key={`intro-year-${year}`}
                            onHoverIn={() => setHoveredIntroYear(year)}
                            onHoverOut={() => setHoveredIntroYear((current) => (current === year ? null : current))}
                            onPressIn={() => setHoveredIntroYear(year)}
                            onPress={() => {
                              setIntroYear(year);
                              setIsIntroYearDropdownOpen(false);
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
              <Pressable
                onPress={() => {
                  if (!introCountryId || introYear == null) {
                    return;
                  }
                  onDismissNavIntro?.();
                  if (introCountryId !== country.id) {
                    onSelectCountry(introCountryId);
                  }
                  if (introYear !== selectedYear) {
                    onChangeYear(introYear);
                  }
                }}
                onHoverIn={() => setIsIntroDiscoverHovered(true)}
                onHoverOut={() => setIsIntroDiscoverHovered(false)}
                onPressIn={() => setIsIntroDiscoverPressed(true)}
                onPressOut={() => setIsIntroDiscoverPressed(false)}
                style={styles.navIntroButtonShell}
              >
                {isIntroDiscoverHovered || isIntroDiscoverPressed ? (
                  <LinearGradient
                    colors={isIntroDiscoverPressed ? activeGradient : hoverGradient}
                    locations={[0, 0.34, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.navIntroButtonGradient}
                  />
                ) : null}
                <Text style={[styles.navIntroButtonText, isIntroDiscoverHovered || isIntroDiscoverPressed ? styles.navIntroButtonTextActive : null]}>
                  Discover Hidden Gems
                </Text>
              </Pressable>
            </View>
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
        } as unknown as ViewStyle)
      : null),
  },
  navIntroOverlayNative: {
    justifyContent: "center",
    padding: 24,
  },
  navIntroOverlayGradientWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  navIntroOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  navIntroModal: {
    width: "100%",
    maxWidth: 760,
    minHeight: 420,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(169, 176, 209, 0.24)",
    backgroundColor: colors.panel,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    overflow: "visible",
  },
  navIntroModalDepthFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  navIntroModalContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    overflow: "visible",
  },
  navIntroModalNative: {
    minHeight: 0,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 22,
  },
  navIntroControls: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    zIndex: 200,
  },
  navIntroControlsNative: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    width: "auto",
    alignSelf: "center",
  },
  navIntroDropdownWrap: {
    width: 180,
    zIndex: 220,
  },
  navIntroCountryDropdownWrap: {
    zIndex: 240,
  },
  navIntroYearDropdownWrap: {
    zIndex: 230,
  },
  navIntroDropdownWrapNative: {
    width: 156,
    maxWidth: 156,
  },
  navIntroCountryDropdownMenu: {
    zIndex: 260,
    elevation: 260,
  },
  navIntroYearDropdownMenu: {
    zIndex: 250,
    elevation: 250,
  },
  navIntroTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 40,
    lineHeight: 44,
    textAlign: "center",
  },
  navIntroTitleNative: {
    fontSize: 48,
    lineHeight: 48,
  },
  navIntroBody: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    maxWidth: 620,
  },
  navIntroBodyNative: {
    fontSize: 16,
    lineHeight: 25,
  },
  navIntroButtonShell: {
    position: "relative",
    overflow: "hidden",
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
  navIntroButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  navIntroButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 17,
    lineHeight: 19,
  },
  navIntroButtonTextActive: {
    color: colors.textLight,
  },
  pageFrame: {
    flex: 1,
    marginTop: -4,
    gap: 16,
  },
  pageFrameHiddenBehindIntro: {
    opacity: 0,
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
    maxWidth: 680,
    justifyContent: "flex-start",
    transform: [{ translateY: 1 }],
  },
  blurbCopyWebReserved: {
    minWidth: 360,
    maxWidth: 520,
    flexGrow: 1,
    flexShrink: 1,
  },
  blurbCopyStacked: {
    width: "100%",
    maxWidth: "100%",
    paddingRight: 0,
  },
  blurbHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 6,
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
    marginTop: 8,
  },
  blurbRightRail: {
    width: 392,
    minWidth: 392,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
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
    marginLeft: 0,
  },
  blurbControlsRowStacked: {
    flexWrap: "wrap",
    rowGap: 8,
    justifyContent: "flex-end",
  },
  blurbFiltersArea: {
    width: 116,
    position: "relative",
    zIndex: 120,
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
  blurbYearDropdownTextActive: {
    color: colors.textLight,
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
    left: 0,
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
    gap: 12,
    alignItems: "stretch",
  },
  primaryPanelsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  primaryPanelsRowStacked: {
    flexDirection: "column",
  },
  panelColumn: {
    minWidth: 0,
  },
  panelColumnStacked: {
    width: "100%",
  },
  playingPanelColumn: {
    flex: 0.94,
  },
  songListPanelColumn: {
    flex: 1.06,
  },
  secondaryPanel: {
    minHeight: Platform.OS === "web" ? 760 : 618,
    maxHeight: Platform.OS === "web" ? 760 : 618,
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
  playingSideContentNative: {
    paddingLeft: 20,
    paddingRight: 20,
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
    position: "relative",
  },
  miniCdHoverTarget: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  songArtMetaWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  songExplicitBadgeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  miniCdCaseBackdropWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  miniCdCaseBackdrop: {
    position: "absolute",
    borderRadius: 0,
    overflow: "hidden",
  },
  miniCdCaseBackdropImage: {
    width: "100%",
    height: "100%",
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
    marginBottom: 6,
  },
  blankCdCaseFrame: {
    width: 450,
    height: 450,
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  blankCdCaseBackdropWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  blankCdCaseBackdrop: {
    position: "absolute",
    borderRadius: 0,
    backgroundColor: "rgb(108,119,142)",
  },
  blankCdCaseLoadingOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,16,21,0.16)",
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
  mainCdControlsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  mainCdControlsRowNative: {
    marginTop: -10,
    gap: 14,
  },
  mainCdControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 0,
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
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 0,
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
  mainCdControlButtonDisabled: {
    opacity: 0.42,
  },
  mainCdControlInner: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    alignItems: "center",
    justifyContent: "center",
  },
  mainCdControlSpinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,16,21,0.08)",
  },
  mainCdControlInnerActive: {
    backgroundColor: "transparent",
  },
  mainCdControlFill: {
    ...StyleSheet.absoluteFillObject,
  },
  mainCdControlGemLeft: {
    transform: [{ translateX: -1 }, { rotate: "90deg" }],
  },
  mainCdControlGemRight: {
    transform: [{ translateX: 1 }, { rotate: "-90deg" }],
  },
  playGlyph: {
    width: 32,
    height: 32,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: 2 }],
  },
  playGlyphTriangleOuter: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 17,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: colors.border,
  },
  playGlyphTriangleInner: {
    position: "absolute",
    left: 8,
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 13,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: colors.accent,
  },
  pauseGlyph: {
    width: 36,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  pauseGlyphBarOuter: {
    width: 8,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseGlyphBarInner: {
    width: 4,
    height: 18,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  playingSongLine: {
    flexShrink: 1,
    textAlign: "center",
    marginTop: -2,
    marginBottom: 2,
  },
  playingSongLineWrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  playingSongExplicitWrap: {
    flexShrink: 0,
    marginTop: -1,
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
  playingTracklistLine: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "left",
  },
  playingTracklistNumber: {
    color: colors.textLight,
    fontFamily: typefaces.display,
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
  favoriteArtistsRowExpanded: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingRight: 0,
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
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 4,
    ...(Platform.OS === "web"
      ? ({
          cursor: "auto",
        } as ViewStyle)
      : null),
  },
  favoriteArtistItemActive: {
    opacity: 0.96,
  },
  favoriteArtistCdWrap: {
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
    overflow: "visible",
  },
  favoriteArtistCdShadow: {
    position: "absolute",
    left: "50%",
    top: 0,
    marginLeft: -54,
    borderRadius: 6,
    zIndex: -1,
    backgroundColor: "rgba(0,0,0,0.02)",
    shadowColor: colors.shadow,
    shadowOpacity: 0.42,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0px 14px 34px rgba(0,0,0,0.44)",
        } as ViewStyle)
      : null),
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
    position: "relative",
  },
  cdCaseBackdrop: {
    position: "absolute",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cdCaseImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    shadowColor: colors.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
});
