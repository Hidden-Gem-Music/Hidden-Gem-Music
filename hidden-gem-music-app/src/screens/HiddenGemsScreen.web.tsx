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
import { availableYears as allAvailableYears } from "../data/mockData";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  country: Country;
  countries: Country[];
  songs: Song[];
  selectedSongId: string;
  selectedSong: Song;
  onSelectSong: (songId: string) => void;
  onSelectCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;
const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const controlButtonGradient = [colors.backgroundRaised, colors.backgroundRaised, colors.navGradient] as const;
const cdCaseSource = require("../assets/images/CD-Case-Transparent-Image.png");
const rowBackdropColors = ["#B86A72", "#8B9BC0", "#8B5E7A", "#627F8A", "#C28C5E", "#7A7EB0"];
const SONG_BATCH_SIZE = 25;
const hiddenGemTitleTerms = ["Afterlight", "Glassroom", "Signal", "Static", "Midnight", "Echo", "Receiver", "Velvet"];
const hiddenGemAlbumTerms = ["Circuit", "Atlas", "Bloom", "Relay", "Theatre", "Horizon", "Current", "Transit"];
const hiddenGemDescriptionTerms = [
  "A quieter cut with strong late-night energy and a more country-specific pull.",
  "Feels like a buried standout that never got the same wider reach as the bigger songs.",
  "Built around the same scene textures, but with a more hidden-gem kind of appeal.",
  "Carries the same mood as the most-loved songs, but lands more like a personal discovery.",
];

function buildGeneratedHiddenGemSongs(country: Country, songs: Song[]) {
  return Array.from({ length: 25 }, (_, index) => {
    const leadArtist = country.featuredArtists[index % country.featuredArtists.length] ?? country.albumArtist;
    const titleLead = hiddenGemTitleTerms[index % hiddenGemTitleTerms.length];
    const titleTail = hiddenGemTitleTerms[(index + 3) % hiddenGemTitleTerms.length];
    const albumTail = hiddenGemAlbumTerms[index % hiddenGemAlbumTerms.length];
    const baseSong = songs[index % Math.max(songs.length, 1)];

    return {
      id: `${country.id}-generated-hidden-gem-${index + 1}`,
      title: `${country.name} ${titleLead} ${titleTail}`,
      artist: leadArtist,
      album: baseSong?.album ?? `${country.album} ${albumTail}`,
      genres: baseSong?.genres?.length ? baseSong.genres : country.genres.slice(0, 2),
      languages: baseSong?.languages?.length ? baseSong.languages : country.languages.slice(0, 2),
      year: baseSong?.year ?? 2021,
      duration: baseSong?.duration ?? "3:42",
      description: hiddenGemDescriptionTerms[index % hiddenGemDescriptionTerms.length],
      spotifySearchUrl:
        baseSong?.spotifySearchUrl ??
        `https://open.spotify.com/search/${encodeURIComponent(`${leadArtist} ${country.name} ${titleLead} ${titleTail}`)}`,
    } satisfies Song;
  });
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

function HiddenSongListPanel({
  country,
  songs,
  selectedSongId,
  onSelectSong,
  onPlaySong,
}: {
  country: Country;
  songs: Song[];
  selectedSongId: string;
  onSelectSong: (songId: string) => void;
  onPlaySong: (songId: string) => void;
}) {
  const scrollbar = useCustomScrollbar();
  const [hoveredSongId, setHoveredSongId] = useState<string | null>(null);
  const [hoveredMiniCdSongId, setHoveredMiniCdSongId] = useState<string | null>(null);
  const [visibleSongCount, setVisibleSongCount] = useState(Math.min(SONG_BATCH_SIZE, songs.length));

  useEffect(() => {
    setVisibleSongCount(Math.min(SONG_BATCH_SIZE, songs.length));
  }, [country.id, songs.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollbar.setScrollY(event.nativeEvent.contentOffset.y);

    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 180;
    if (nearBottom && visibleSongCount < songs.length) {
      setVisibleSongCount((current) => Math.min(current + SONG_BATCH_SIZE, songs.length));
    }
  };

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
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {songs.slice(0, visibleSongCount).map((song, index) => (
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
                        <Text style={[styles.songRowTitle, showGradient ? styles.songTextActive : null]}>{song.title}</Text>
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

  return (
    <Panel style={styles.secondaryPanel}>
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
              {...(Platform.OS === "web"
                ? ({
                    onMouseEnter: () => setIsHoveringMainCd(true),
                    onMouseLeave: () => setIsHoveringMainCd(false),
                  } as any)
                : {})}
            >
              <BlankCdCase />
              {isHoveringMainCd ? (
                <View style={styles.mainCdControlsOverlay}>
                  <Pressable style={styles.mainCdControlButton} onPress={onPreviousSong}>
                    <LinearGradient
                      colors={controlButtonGradient}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.mainCdControlFill}
                    />
                    <Text style={[styles.mainCdControlIcon, styles.mainCdControlIconSkipLeft]}>◀</Text>
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
                    <Text style={[styles.mainCdControlIcon, styles.mainCdControlIconSkipRight]}>▶</Text>
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
  songs,
  selectedSongId,
  selectedSong,
  onSelectSong,
  onSelectCountry,
  selectedYear,
  onChangeYear,
}: Props) {
  const { width } = useWindowDimensions();
  const isStacked = width < 1120;
  const hiddenGemSongs = useMemo(() => [...songs, ...buildGeneratedHiddenGemSongs(country, songs)], [country, songs]);
  const [activeSongId, setActiveSongId] = useState<string>(
    () => selectedSongId || selectedSong?.id || hiddenGemSongs[0]?.id || ""
  );
  const safeSelectedSong =
    hiddenGemSongs.find((song) => song.id === activeSongId) ??
    hiddenGemSongs.find((song) => song.id === selectedSongId) ??
    selectedSong ??
    hiddenGemSongs[0];
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
  const yearOptions = useMemo(() => allAvailableYears.slice().reverse(), []);
  const countryOptions = useMemo(() => countries.slice().sort((left, right) => left.name.localeCompare(right.name)), [countries]);
  const showCountryDropdownGradient = isCountryDropdownHovered || isCountryDropdownPressed || isCountryDropdownOpen;
  const showYearDropdownGradient = isYearDropdownHovered || isYearDropdownPressed || isYearDropdownOpen;

  useEffect(() => {
    if (!selectedSongId) {
      return;
    }
    if (!hiddenGemSongs.some((song) => song.id === selectedSongId)) {
      return;
    }
    setActiveSongId(selectedSongId);
  }, [hiddenGemSongs, selectedSongId]);

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

  if (!safeSelectedSong) {
    return (
      <ScreenScaffold>
        <View style={styles.pageFrame} />
      </ScreenScaffold>
    );
  }

  const selectedSongIndex = hiddenGemSongs.findIndex((song) => song.id === safeSelectedSong.id);

  const setSongSelection = (songId: string) => {
    setActiveSongId(songId);
    if (songs.some((song) => song.id === songId)) {
      onSelectSong(songId);
    }
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
    if (previewSongId !== safeSelectedSong.id) {
      setPreviewSongId(safeSelectedSong.id);
      setIsPreviewPlaying(true);
      return;
    }
    setIsPreviewPlaying((current) => !current);
  };

  return (
    <ScreenScaffold>
      <View style={styles.pageFrame}>
        <Panel style={styles.blurbPanel}>
          <LinearGradient
            colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.42)", "rgba(66,72,101,0.72)"]}
            locations={[0, 0.42, 0.78, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.blurbFill}
          />
          <View style={styles.blurbContent}>
            <View style={styles.blurbCopy}>
              <Text style={styles.blurbText}>
                <Text style={styles.blurbHeading}>{country.name}&apos;s Hidden Gems</Text>
                {"  "}
                <GemIcon size={16} style={styles.blurbIcon} />
                {"  "}
                <Text style={styles.blurbBody}>
                  This is text explaining to users what a hidden gem actually is and what that means. This is text
                  explaining to users what a hidden gem actually is and what that means. Hover over the selected
                  song&apos;s CD to view the play and pause button. Click play to listen to a 30 second preview of
                  the song.
                </Text>
              </Text>
            </View>
            <View style={styles.blurbRightRail}>
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
                      <Text style={styles.blurbYearDropdownText}>Select Country</Text>
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
                      <Text style={styles.blurbYearDropdownText}>Select Year</Text>
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
            <HiddenSongListPanel
              country={country}
              songs={hiddenGemSongs}
              selectedSongId={safeSelectedSong.id}
              onSelectSong={setSongSelection}
              onPlaySong={selectSongAndAutoPlay}
            />
          </View>
          <View style={styles.panelColumn}>
            <PlayingSidePanel
              selectedSong={safeSelectedSong}
              isPlayingPreview={isPreviewPlaying && previewSongId === safeSelectedSong.id}
              onTogglePreview={toggleSelectedSongPreview}
              onPreviousSong={() => stepSong(-1)}
              onNextSong={() => stepSong(1)}
            />
          </View>
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
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
  blurbCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 18,
    justifyContent: "flex-start",
    transform: [{ translateY: 1 }],
  },
  blurbText: {
    textAlign: "left",
  },
  blurbIcon: {
    transform: [{ translateY: 1 }],
  },
  blurbHeading: {
    color: colors.text,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  blurbBody: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  blurbRightRail: {
    width: 252,
    minWidth: 242,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
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
    fontSize: 40,
    lineHeight: 40,
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
    color: colors.text,
  },
  layout: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  layoutStacked: {
    flexDirection: "column",
  },
  panelColumn: {
    flex: 1,
    minWidth: 340,
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    paddingRight: 28,
    gap: 6,
  },
  playingSideContent: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 24,
    paddingRight: 28,
    gap: 10,
    alignItems: "center",
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
    color: colors.text,
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
    color: colors.text,
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
  },
  mainCdControlFill: {
    ...StyleSheet.absoluteFillObject,
  },
  mainCdControlIcon: {
    color: colors.text,
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
    color: colors.text,
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
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 27,
    lineHeight: 31,
  },
  playingSongBy: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 22,
    lineHeight: 31,
  },
  playingSongArtistInline: {
    color: colors.text,
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
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "left",
  },
  playingMetaLabel: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 17,
    lineHeight: 22,
  },
  playingMetaValue: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    lineHeight: 22,
  },
  scrollbarTrack: {
    position: "absolute",
    top: 12,
    right: 8,
    bottom: 12,
    width: 14,
    borderRadius: 999,
    backgroundColor: "rgba(108,118,143,0.45)",
  },
  scrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(117,82,107,0.58)",
  },
});
