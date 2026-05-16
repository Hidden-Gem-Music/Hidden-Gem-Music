import { LinearGradient } from "expo-linear-gradient";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Defs, Path, RadialGradient as SvgRadialGradient, Stop } from "react-native-svg";

import {
  worldMapContinentOutlines,
  worldMapCountries,
  worldMapProjection,
} from "../../assets/maps/worldMap50m";
import { colors } from "../../theme/colors";
import { typefaces } from "../../theme/typography";
import { Country } from "../../types/content";
import { GemIcon } from "../GemIcon";

type Props = {
  countries: Country[];
  allCountries?: Country[];
  activeCountry?: Country;
  externalHoveredCountryId?: string | null;
  selectedCountryIds?: string[];
  selectedYear?: number;
  availableYears?: number[];
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
  onChangeYear?: (year: number) => void;
  onFiltersPress?: () => void;
  selectOnHover?: boolean;
  genreSummaryByCountryCode?: Record<string, string | undefined>;
  genreLoadingByCountryCode?: Record<string, boolean | undefined>;
  loadingText?: string;
  onEnsureGenreSample?: (countryCode: string) => void;
  isActive?: boolean;
};

type ViewportOffset = {
  x: number;
  y: number;
};

type MapControl = "zoomIn" | "zoomOut" | "filters" | "year" | "panUp" | "panLeft" | "panRight" | "panDown" | "reset";

const BASE_MAP_SIZE = worldMapProjection.width;
const MAP_VIEWPORT_HEIGHT = worldMapProjection.height;
const BASE_SCENE_HEIGHT = worldMapProjection.height;
const MAP_TOP = 0;
const SVG_OFFSET_Y = 0;
const BASE_CENTER_X = BASE_MAP_SIZE / 2;
const BASE_CENTER_Y = BASE_MAP_SIZE / 2;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5.4;
const DEFAULT_ZOOM = 2.6;
const ZOOM_STEP = 0.4;
const DEFAULT_OFFSET: ViewportOffset = { x: 120, y: 64 };
const PAN_SPEED = 2.35;
const CONTROL_NUDGE = 32;
const MOBILE_HELPER_INFO_PANEL_HEIGHT = 174;
const MOBILE_DETAIL_INFO_PANEL_HEIGHT = 138;
const COUNTRY_STROKE = "rgba(169, 176, 209, 0.22)";
const ACTIVE_COUNTRY_STROKE = "rgba(240, 232, 241, 0.88)";
const ACTIVE_COUNTRY_GLOW = "rgba(15, 16, 21, 0.52)";
const HOVER_COUNTRY_GLOW = "rgba(15, 16, 21, 0.42)";
const COMPARISON_PRIMARY = "#C488A3";
const COMPARISON_SECONDARY = "#88A8D8";
const MOBILE_COUNTRY_FILL = "#75526B";
const MOBILE_ACTIVE_COUNTRY_FILL = "#8EADE1";
const CONTROL_ACTIVE_GRADIENT = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const INTERACTION_SUPPRESS_MS = 140;
const MAP_GUIDE_COPY =
  "Hover over a country to view its stat card, use the Timeline slider below the map to change the displayed year, click a country to view its detail page, or utilize Comparison Mode in the main navigation.";
const MOBILE_MAP_GUIDE_COPY =
  "Tap a country once to view its stat card. Tap the glassy blurb or that country again to open its detail page. Use the year, filter, arrows, and zoom controls below to explore the map.";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clampOffset(offset: ViewportOffset, zoom: number) {
  const horizontal = Math.max(8, ((BASE_MAP_SIZE * zoom) - BASE_MAP_SIZE) / 2 + 8);
  const vertical = Math.max(8, ((BASE_SCENE_HEIGHT * zoom) - MAP_VIEWPORT_HEIGHT) / 2 + 8);

  return {
    x: clamp(offset.x, -horizontal, horizontal),
    y: clamp(offset.y, -vertical, vertical),
  };
}

function getCenteredOffset(targetX: number, targetY: number, zoom: number) {
  return clampOffset(
    {
      x: (BASE_CENTER_X - targetX) * zoom,
      y: (BASE_CENTER_Y - targetY) * zoom,
    },
    zoom
  );
}

function getSelectionColor(countryId: string, selectedCountryIds?: string[]) {
  if (!selectedCountryIds || selectedCountryIds.length === 0) {
    return null;
  }

  if (selectedCountryIds[0] === countryId) {
    return COMPARISON_PRIMARY;
  }

  if (selectedCountryIds[1] === countryId) {
    return COMPARISON_SECONDARY;
  }

  return null;
}

function getShapeKey(
  shape: Pick<(typeof worldMapCountries)[number], "code" | "id">,
  shapeIndex: number
) {
  return `${shape.code ?? "no-code"}-${shape.id ?? "no-id"}-${shapeIndex}`;
}

function getPathBounds(path: string) {
  const numbers = path.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  if (numbers.length < 2) {
    return {
      minX: 0,
      minY: 0,
      maxX: BASE_MAP_SIZE,
      maxY: BASE_SCENE_HEIGHT,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < numbers.length - 1; index += 2) {
    const x = numbers[index];
    const y = numbers[index + 1];

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return {
      minX: 0,
      minY: 0,
      maxX: BASE_MAP_SIZE,
      maxY: BASE_SCENE_HEIGHT,
    };
  }

  return { minX, minY, maxX, maxY };
}

export function GlobeView({
  countries,
  allCountries,
  activeCountry,
  externalHoveredCountryId,
  selectedCountryIds,
  selectedYear,
  availableYears,
  onSelectCountry,
  onOpenCountry,
  onChangeYear,
  onFiltersPress,
  selectOnHover = true,
  genreSummaryByCountryCode,
  genreLoadingByCountryCode,
  loadingText = "Loading...",
  onEnsureGenreSample,
  isActive = true,
}: Props) {
  const { width } = useWindowDimensions();
  const isNativeMobile = Platform.OS !== "web";
  const useMobilePanelLayout = isNativeMobile || width < 980;
  const [hoveredControl, setHoveredControl] = useState<MapControl | null>(null);
  const [pressedControl, setPressedControl] = useState<MapControl | null>(null);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [focusedCountryId, setFocusedCountryId] = useState<string | null>(null);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [offset, setOffset] = useState<ViewportOffset>(DEFAULT_OFFSET);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverSelectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverSyncFrameRef = useRef<number | null>(null);
  const hoveredCountryIdRef = useRef<string | null>(null);
  const focusedCountryIdRef = useRef<string | null>(null);
  const controlActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offsetStartRef = useRef<ViewportOffset>(DEFAULT_OFFSET);
  const offsetRef = useRef<ViewportOffset>(DEFAULT_OFFSET);
  const zoomRef = useRef(DEFAULT_ZOOM);
  const isDraggingRef = useRef(false);
  const suppressInteractionsUntilRef = useRef(0);
  const fallbackWidth = Math.max(316, Math.min(760, width - 30));
  const sceneWidth = containerWidth > 0 ? Math.max(316, containerWidth) : fallbackWidth;
  const sceneScale = sceneWidth / BASE_MAP_SIZE;
  const mapCountries = allCountries && allCountries.length > 0 ? allCountries : countries;
  const countryByCode = useMemo(
    () => new Map(mapCountries.map((country) => [country.code.trim().toUpperCase(), country])),
    [mapCountries]
  );
  const countryShapeMetadata = useMemo(
    () =>
      worldMapCountries.map((shape, shapeIndex) => ({
        shape,
        shapeIndex,
        shapeKey: getShapeKey(shape, shapeIndex),
        bounds: getPathBounds(shape.path),
      })),
    []
  );
  const shapeMetadataByCode = useMemo(
    () =>
      new Map(
        countryShapeMetadata
          .filter(({ shape }) => Boolean(shape.code))
          .map((entry) => [entry.shape.code!.trim().toUpperCase(), entry] as const)
      ),
    [countryShapeMetadata]
  );
  const effectiveHoveredCountryId = externalHoveredCountryId ?? hoveredCountryId;
  const hoveredOrFocusedCountryId = effectiveHoveredCountryId ?? focusedCountryId;
  const cardCountry = mapCountries.find((country) => country.id === hoveredOrFocusedCountryId) ?? null;
  const hasHiddenGems = (cardCountry?.hiddenSongs ?? 0) > 0;
  const selectedYearLabel = selectedYear ?? "this year";
  const yearOptions = availableYears && availableYears.length > 0 ? [...availableYears].sort((a, b) => b - a) : [];
  const noHiddenGemsCopy = selectedYear ? `No Hidden Gems for ${selectedYear}` : "No Hidden Gems for this year";
  const hasNoSongData =
    cardCountry
      ? cardCountry.hasSongData === false ||
        cardCountry.album.trim().toLowerCase().startsWith("unknown") ||
        cardCountry.albumArtist.trim().toLowerCase().startsWith("unknown")
      : false;
  const noSongDataCopy = selectedYear ? `No song data for ${selectedYear}` : "No song data for this year";
  const showInfoPanel = Boolean(onFiltersPress);
  const webPressableProps =
    Platform.OS === "web"
      ? ({
          onMouseDown: (event: any) => event.preventDefault(),
        } as any)
      : {};
  const getControlGradient = (control: MapControl) => {
    if (control === "filters" || control === "year") {
      if (pressedControl === control) {
        return ["rgba(78,51,74,0.9)", "rgba(69,80,106,0.72)", "rgba(27,28,47,0.86)"] as const;
      }
      if (hoveredControl === control) {
        return ["rgba(101,69,92,0.82)", "rgba(92,103,130,0.56)", "rgba(34,36,59,0.72)"] as const;
      }
      return ["rgba(117,82,107,0.68)", "rgba(108,119,142,0.44)", "rgba(44,46,75,0.58)"] as const;
    }

    if (Platform.OS === "web" && (control === "zoomIn" || control === "zoomOut")) {
      if (pressedControl === control) {
        return ["rgba(78,51,74,0.9)", "rgba(69,80,106,0.72)", "rgba(27,28,47,0.86)"] as const;
      }
      if (hoveredControl === control) {
        return ["rgba(101,69,92,0.82)", "rgba(92,103,130,0.56)", "rgba(34,36,59,0.72)"] as const;
      }
      return ["rgba(117,82,107,0.68)", "rgba(108,119,142,0.44)", "rgba(44,46,75,0.58)"] as const;
    }

    if (pressedControl === control) {
      return [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
    }
    if (hoveredControl === control) {
      return ["rgba(117,82,107,0.68)", "rgba(108,119,142,0.44)", "rgba(44,46,75,0.58)"] as const;
    }
    if (isNativeMobile) {
      return ["rgba(117,82,107,0.24)", "rgba(108,119,142,0.12)", "rgba(44,46,75,0.28)"] as const;
    }
    return null;
  };

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    hoveredCountryIdRef.current = hoveredCountryId;
  }, [hoveredCountryId]);

  useEffect(() => {
    focusedCountryIdRef.current = focusedCountryId;
  }, [focusedCountryId]);

  useEffect(() => {
    setIsYearMenuOpen(false);
  }, [selectedYear]);

  useEffect(() => {
    if (isActive) {
      setFocusedCountryId(null);
      setHoveredCountryId(null);
    }
  }, [isActive]);

  useEffect(() => {
    if (Platform.OS !== "web" || !externalHoveredCountryId) {
      return;
    }

    const hoveredCountry = mapCountries.find((country) => country.id === externalHoveredCountryId);
    if (!hoveredCountry) {
      return;
    }

    const shapeMetadata = shapeMetadataByCode.get(hoveredCountry.code.trim().toUpperCase());
    if (!shapeMetadata) {
      return;
    }

    const targetX = (shapeMetadata.bounds.minX + shapeMetadata.bounds.maxX) / 2;
    const targetY = (shapeMetadata.bounds.minY + shapeMetadata.bounds.maxY) / 2;
    setOffset(getCenteredOffset(targetX, targetY, zoomRef.current));
  }, [externalHoveredCountryId, mapCountries, shapeMetadataByCode]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hoverSelectTimeoutRef.current) {
        clearTimeout(hoverSelectTimeoutRef.current);
      }
      if (hoverSyncFrameRef.current != null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(hoverSyncFrameRef.current);
      }
      if (controlActionTimerRef.current) {
        clearTimeout(controlActionTimerRef.current);
      }
      if (controlReleaseTimerRef.current) {
        clearTimeout(controlReleaseTimerRef.current);
      }
    };
  }, []);

  const interactionsSuppressed = () =>
    isDraggingRef.current || Date.now() < suppressInteractionsUntilRef.current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          suppressInteractionsUntilRef.current = Date.now() + INTERACTION_SUPPRESS_MS;
          offsetStartRef.current = offsetRef.current;
          if (hoverSelectTimeoutRef.current) {
            clearTimeout(hoverSelectTimeoutRef.current);
            hoverSelectTimeoutRef.current = null;
          }
          setHoveredCountryId(null);
        },
        onPanResponderMove: (_, gestureState) => {
          setOffset(
            clampOffset(
              {
                x: offsetStartRef.current.x + gestureState.dx * PAN_SPEED / sceneScale,
                y: offsetStartRef.current.y + gestureState.dy * PAN_SPEED / sceneScale,
              },
              zoomRef.current
            )
          );
        },
        onPanResponderRelease: () => {
          isDraggingRef.current = false;
          suppressInteractionsUntilRef.current = Date.now() + INTERACTION_SUPPRESS_MS;
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          suppressInteractionsUntilRef.current = Date.now() + INTERACTION_SUPPRESS_MS;
        },
      }),
    [sceneScale]
  );
  const panHandlers = Platform.OS === "web" ? panResponder.panHandlers : {};

  const clearHoverLater = (countryId: string) => {
    if (hoverSelectTimeoutRef.current) {
      clearTimeout(hoverSelectTimeoutRef.current);
      hoverSelectTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCountryId((current) => (current === countryId ? null : current));
      hoverTimeoutRef.current = null;
    }, 24);
  };

  const handleCountryPreview = (country: Country) => {
    if (interactionsSuppressed()) {
      return;
    }
    if (hoveredCountryId === country.id) {
      return;
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (hoverSelectTimeoutRef.current) {
      clearTimeout(hoverSelectTimeoutRef.current);
      hoverSelectTimeoutRef.current = null;
    }

    setHoveredCountryId(country.id);
    if (selectOnHover) {
      hoverSelectTimeoutRef.current = setTimeout(() => {
        if (hoveredCountryIdRef.current !== country.id) {
          hoverSelectTimeoutRef.current = null;
          return;
        }

        if (hoverSyncFrameRef.current != null && typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(hoverSyncFrameRef.current);
        }
        hoverSyncFrameRef.current =
          typeof requestAnimationFrame === "function"
            ? requestAnimationFrame(() => {
                onSelectCountry(country.id);
                hoverSyncFrameRef.current = null;
              })
            : null;
        if (hoverSyncFrameRef.current == null) {
          onSelectCountry(country.id);
        }
        hoverSelectTimeoutRef.current = null;
      }, 80);
    }
  };

  const triggerPrimaryAction = (countryId: string) => {
    if (onOpenCountry) {
      onOpenCountry(countryId);
      return;
    }

    onSelectCountry(countryId);
  };

  const handleMapCountryPress = (country: Country) => {
    if (interactionsSuppressed()) {
      return;
    }

    setIsYearMenuOpen(false);

    if (Platform.OS === "web") {
      triggerPrimaryAction(country.id);
      return;
    }

    if (focusedCountryIdRef.current === country.id) {
      triggerPrimaryAction(country.id);
      return;
    }

    focusedCountryIdRef.current = country.id;
    setFocusedCountryId(country.id);
    onSelectCountry(country.id);
  };

  const runMobileControlAction = (
    control: Exclude<MapControl, "filters" | "year">,
    action: () => void
  ) => {
    setPressedControl(control);
    if (controlActionTimerRef.current) {
      clearTimeout(controlActionTimerRef.current);
    }
    controlActionTimerRef.current = globalThis.setTimeout(() => {
      controlActionTimerRef.current = null;
      action();
    }, 45);
  };

  const clearMobileControlPressLater = (
    control: Exclude<MapControl, "filters" | "year">
  ) => {
    if (controlReleaseTimerRef.current) {
      clearTimeout(controlReleaseTimerRef.current);
    }
    controlReleaseTimerRef.current = globalThis.setTimeout(() => {
      controlReleaseTimerRef.current = null;
      setPressedControl((current) => (current === control ? null : current));
    }, 95);
  };

  const applyZoom = (nextZoom: number) => {
    setIsYearMenuOpen(false);
    setZoom(nextZoom);
    setOffset((current) =>
      clampOffset(
        {
          x: current.x * nextZoom / zoomRef.current,
          y: current.y * nextZoom / zoomRef.current,
        },
        nextZoom
      )
    );
  };

  const nudgeViewport = (deltaX: number, deltaY: number) => {
    setIsYearMenuOpen(false);
    setOffset((current) =>
      clampOffset(
        {
          x: current.x + deltaX,
          y: current.y + deltaY,
        },
        zoomRef.current
      )
    );
  };

  const viewBoxWidth = BASE_MAP_SIZE / zoom;
  const viewBoxHeight = BASE_SCENE_HEIGHT / zoom;
  const viewBoxX = BASE_CENTER_X - viewBoxWidth / 2 - offset.x / zoom;
  const viewBoxY = BASE_CENTER_Y - viewBoxHeight / 2 - offset.y / zoom;
  const svgViewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
  const baseStrokeWidth = isNativeMobile ? 0.42 : zoom <= 1.2 ? 0.28 : zoom <= 1.8 ? 0.34 : zoom <= 2.6 ? 0.42 : 0.5;
  const canZoomOut = zoom > MIN_ZOOM + 0.01;
  const canZoomIn = zoom < MAX_ZOOM - 0.01;
  const hoveredCountryStats = cardCountry
    ? [
        `Hidden Gems:  ${hasHiddenGems ? `${cardCountry.hiddenSongs}` : noHiddenGemsCopy}`,
        hasNoSongData
          ? `Most popular album in ${selectedYearLabel}:  ${noSongDataCopy}`
          : `Most popular album in ${selectedYearLabel}:  ${cardCountry.album} by ${cardCountry.albumArtist}`,
      ]
    : null;
  const mobileInfoPanelHeight = hoveredCountryStats ? MOBILE_DETAIL_INFO_PANEL_HEIGHT : MOBILE_HELPER_INFO_PANEL_HEIGHT;
  const baseSceneHeight = BASE_SCENE_HEIGHT + (useMobilePanelLayout ? mobileInfoPanelHeight : 0);
  const sceneHeight = baseSceneHeight * sceneScale;
  const isViewportAtDefault =
    Math.abs(offset.x - DEFAULT_OFFSET.x) <= 0.8 &&
    Math.abs(offset.y - DEFAULT_OFFSET.y) <= 0.8 &&
    Math.abs(zoom - DEFAULT_ZOOM) <= 0.02;
  const handleGlobeAreaLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  };

  return (
    <View style={[styles.globeArea, { minHeight: sceneHeight }]} onLayout={handleGlobeAreaLayout}>
      <View style={[styles.scene, { width: sceneWidth, height: sceneHeight }]}>
        <View style={[styles.sceneInner, { height: baseSceneHeight, transform: [{ scale: sceneScale }] }]}>
          <View
            style={[
              styles.mapViewport,
              useMobilePanelLayout ? styles.mapViewportMobile : null,
              useMobilePanelLayout ? { height: MAP_VIEWPORT_HEIGHT + mobileInfoPanelHeight } : null,
            ]}
            {...panHandlers}
            {...(Platform.OS === "web"
              ? ({
                  onMouseLeave: () => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                    if (hoverSelectTimeoutRef.current) {
                      clearTimeout(hoverSelectTimeoutRef.current);
                      hoverSelectTimeoutRef.current = null;
                    }
                    setHoveredCountryId(null);
                  },
                } as any)
              : null)}
          >
            <LinearGradient
              colors={["#1C2232", "#26304A", "#3D3451", "#6C778E"]}
              locations={[0, 0.24, 0.66, 1]}
              start={{ x: 0.02, y: 0.04 }}
              end={{ x: 0.98, y: 0.96 }}
              style={styles.oceanFill}
            />
            <LinearGradient
              colors={["rgba(117,82,107,0.54)", "rgba(117,82,107,0.16)", "rgba(117,82,107,0)"]}
              locations={[0, 0.42, 1]}
              start={{ x: 0.08, y: 0.05 }}
              end={{ x: 0.9, y: 0.88 }}
              style={styles.backgroundBlendPrimary}
            />
            <LinearGradient
              colors={["rgba(108,119,142,0.48)", "rgba(108,119,142,0.14)", "rgba(108,119,142,0)"]}
              locations={[0, 0.46, 1]}
              start={{ x: 0.94, y: 0.08 }}
              end={{ x: 0.12, y: 0.94 }}
              style={styles.backgroundBlendSecondary}
            />
            <LinearGradient
              colors={["rgba(212,224,249,0.16)", "rgba(212,224,249,0.02)", "rgba(15,16,21,0.24)"]}
              locations={[0, 0.34, 1]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.backgroundBlendDepth}
            />

            {showInfoPanel ? (
              <Pressable
                onPress={cardCountry ? () => triggerPrimaryAction(cardCountry.id) : undefined}
                style={[
                  styles.infoPanelShell,
                  useMobilePanelLayout ? styles.infoPanelShellMobile : null,
                  useMobilePanelLayout ? { height: mobileInfoPanelHeight } : null,
                  cardCountry ? styles.infoPanelShellInteractive : null,
                ]}
                disabled={!cardCountry}
              >
                <LinearGradient
                  colors={["rgba(117,82,107,0.24)", "rgba(108,119,142,0.12)", "rgba(44,46,75,0.28)"]}
                  locations={[0, 0.36, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.infoPanelFill}
                />
                <View style={[styles.infoPanelContent, useMobilePanelLayout ? styles.infoPanelContentMobile : null]}>
                  <View style={[styles.infoPanelHeadingRow, useMobilePanelLayout ? styles.infoPanelHeadingRowMobile : null]}>
                    {cardCountry ? (
                      <Text
                        style={[styles.infoPanelHeading, useMobilePanelLayout ? styles.infoPanelHeadingMobile : null]}
                        numberOfLines={1}
                      >{`${cardCountry.name} in ${selectedYearLabel}:`}</Text>
                    ) : (
                      <>
                        <Text
                          style={[styles.infoPanelHeading, useMobilePanelLayout ? styles.infoPanelHeadingMobile : null]}
                          numberOfLines={1}
                        >
                          Discovery Map
                        </Text>
                        <GemIcon size={12} />
                      </>
                    )}
                  </View>
                  <View style={styles.infoPanelHeadingLine} />
                  <View style={[styles.infoPanelBodyWrap, useMobilePanelLayout ? styles.infoPanelBodyWrapMobile : null]}>
                    {hoveredCountryStats ? (
                      <View style={styles.infoPanelStatsWrap}>
                        {hoveredCountryStats.map((line) => (
                          <View key={line} style={styles.infoPanelBulletRow}>
                            <GemIcon size={useMobilePanelLayout ? 8 : 7} />
                            <Text
                              style={[styles.infoPanelBody, useMobilePanelLayout ? styles.infoPanelBodyMobile : null]}
                              numberOfLines={useMobilePanelLayout ? 2 : 1}
                            >
                              {line}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text
                        style={[styles.infoPanelBody, useMobilePanelLayout ? styles.infoPanelBodyMobile : null]}
                        numberOfLines={useMobilePanelLayout ? 4 : 2}
                      >
                        {useMobilePanelLayout ? MOBILE_MAP_GUIDE_COPY : MAP_GUIDE_COPY}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ) : null}

            <View
              style={[
                styles.svgViewport,
                useMobilePanelLayout ? styles.svgViewportMobile : null,
                useMobilePanelLayout ? { top: mobileInfoPanelHeight } : null,
              ]}
            >
              <Svg
                width={BASE_MAP_SIZE}
                height={BASE_SCENE_HEIGHT}
                viewBox={svgViewBox}
              >
                <Defs>
                  <SvgRadialGradient id="map-country-base-fill" cx="38%" cy="28%" r="88%">
                    <Stop offset="0%" stopColor={colors.backgroundBottom} stopOpacity={0.94} />
                    <Stop offset="54%" stopColor={colors.backgroundRaised} stopOpacity={0.98} />
                    <Stop offset="100%" stopColor={colors.panelAlt} stopOpacity={1} />
                  </SvgRadialGradient>
                  <SvgRadialGradient id="map-country-data-fill" cx="34%" cy="26%" r="92%">
                    <Stop offset="0%" stopColor={colors.navGradient} stopOpacity={0.98} />
                    <Stop offset="50%" stopColor={colors.accent} stopOpacity={0.96} />
                    <Stop offset="100%" stopColor={colors.backgroundRaised} stopOpacity={0.98} />
                  </SvgRadialGradient>
                  <SvgRadialGradient id="map-country-active-fill" cx="36%" cy="24%" r="92%">
                    <Stop offset="0%" stopColor={colors.navGradient} stopOpacity={1} />
                    <Stop offset="52%" stopColor={colors.backgroundRaised} stopOpacity={0.98} />
                    <Stop offset="100%" stopColor={colors.button} stopOpacity={0.96} />
                  </SvgRadialGradient>
                </Defs>
                {countryShapeMetadata.map(({ shape, shapeIndex, shapeKey }) => {
                  const linkedCountry = shape.code ? countryByCode.get(shape.code) : undefined;
                  const isHovered = Boolean(linkedCountry && effectiveHoveredCountryId === linkedCountry.id);
                  const isFocusedCountry = Boolean(linkedCountry && focusedCountryId === linkedCountry.id);
                  const comparisonColor = linkedCountry ? getSelectionColor(linkedCountry.id, selectedCountryIds) : null;
                  const hasMapData = Boolean(linkedCountry);
                  const canInteract = hasMapData;
                  const showGlow = Boolean(comparisonColor || isHovered || isFocusedCountry);
                  const glowColor = comparisonColor ?? (isHovered ? HOVER_COUNTRY_GLOW : ACTIVE_COUNTRY_GLOW);
                  const fill = comparisonColor
                    ? `${comparisonColor}DD`
                    : isNativeMobile
                      ? isHovered || isFocusedCountry
                        ? MOBILE_ACTIVE_COUNTRY_FILL
                        : hasMapData
                          ? MOBILE_COUNTRY_FILL
                          : "transparent"
                      : isHovered || isFocusedCountry
                        ? "url(#map-country-active-fill)"
                        : hasMapData
                          ? "url(#map-country-data-fill)"
                          : "transparent";
                  const stroke = comparisonColor
                    ? comparisonColor
                    : isHovered || isFocusedCountry
                      ? ACTIVE_COUNTRY_STROKE
                      : COUNTRY_STROKE;
                  const pressHandler = canInteract && linkedCountry ? () => handleMapCountryPress(linkedCountry) : undefined;

                  return (
                    <Fragment key={`country-shape-group-${shapeKey}`}>
                      {showGlow && !isNativeMobile ? (
                        <>
                          <Path
                            key={`country-shape-glow-outer-${shapeKey}`}
                            d={shape.path}
                            fill="transparent"
                            stroke={glowColor}
                            strokeWidth={comparisonColor ? 3.2 : isHovered ? 3 : 2.7}
                            strokeOpacity={comparisonColor ? 0.28 : isHovered ? 0.24 : 0.2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                          <Path
                            key={`country-shape-glow-inner-${shapeKey}`}
                            d={shape.path}
                            fill="transparent"
                            stroke={glowColor}
                            strokeWidth={comparisonColor ? 1.9 : isHovered ? 1.7 : 1.5}
                            strokeOpacity={comparisonColor ? 0.36 : isHovered ? 0.3 : 0.24}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </>
                      ) : null}
                      <Path
                        key={`country-shape-${shapeKey}`}
                        d={shape.path}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={comparisonColor ? baseStrokeWidth + 0.08 : isHovered || isFocusedCountry ? baseStrokeWidth + 0.04 : baseStrokeWidth}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        onPress={Platform.OS === "web" ? pressHandler : undefined}
                        onPressIn={undefined}
                        {...(Platform.OS === "web" && linkedCountry
                          ? ({
                              onMouseEnter: () => handleCountryPreview(linkedCountry),
                              onMouseLeave: () => clearHoverLater(linkedCountry.id),
                              cursor: "pointer",
                            } as any)
                          : null)}
                      />
                      {isNativeMobile && canInteract && pressHandler ? (
                        <Path
                          key={`country-shape-hit-${shapeKey}`}
                          d={shape.path}
                          fill="rgba(255,255,255,0.01)"
                          stroke="rgba(255,255,255,0.01)"
                          strokeWidth={4.5}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          onPress={undefined}
                          onPressIn={pressHandler}
                        />
                      ) : null}
                    </Fragment>
                  );
                })}

                {isNativeMobile
                  ? null
                  : worldMapContinentOutlines.map((outline, outlineIndex) => (
                      <Path
                        key={`continent-${outline.id ?? "no-id"}-${outlineIndex}`}
                        d={outline.path}
                        fill="none"
                        stroke="rgba(212, 224, 249, 0.14)"
                        strokeWidth={baseStrokeWidth}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
              </Svg>
            </View>

            <View style={styles.mapControlStack}>
              {isNativeMobile ? (
                <View style={styles.directionPad}>
                  <View style={styles.directionPadRow}>
                    <Pressable
                      onPressIn={() => {
                        runMobileControlAction("panUp", () => nudgeViewport(0, CONTROL_NUDGE));
                      }}
                      onPressOut={() => clearMobileControlPressLater("panUp")}
                      style={[styles.zoomButton, styles.mobileControlButton]}
                      {...webPressableProps}
                    >
                      {getControlGradient("panUp") ? (
                        <LinearGradient
                          colors={getControlGradient("panUp")!}
                          locations={[0, 0.34, 1]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.controlFill}
                        />
                      ) : null}
                      <Text style={[styles.directionButtonText, getControlGradient("panUp") ? styles.zoomButtonTextActive : null]}>↑</Text>
                    </Pressable>
                    <Pressable
                      onPressIn={() => {
                        runMobileControlAction("panDown", () => nudgeViewport(0, -CONTROL_NUDGE));
                      }}
                      onPressOut={() => clearMobileControlPressLater("panDown")}
                      style={[styles.zoomButton, styles.mobileControlButton]}
                      {...webPressableProps}
                    >
                      {getControlGradient("panDown") ? (
                        <LinearGradient
                          colors={getControlGradient("panDown")!}
                          locations={[0, 0.34, 1]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.controlFill}
                        />
                      ) : null}
                      <Text style={[styles.directionButtonText, getControlGradient("panDown") ? styles.zoomButtonTextActive : null]}>↓</Text>
                    </Pressable>
                  </View>
                  <View style={styles.directionPadRow}>
                    <Pressable
                      onPressIn={() => {
                        runMobileControlAction("panLeft", () => nudgeViewport(CONTROL_NUDGE, 0));
                      }}
                      onPressOut={() => clearMobileControlPressLater("panLeft")}
                      style={[styles.zoomButton, styles.mobileControlButton]}
                      {...webPressableProps}
                    >
                      {getControlGradient("panLeft") ? (
                        <LinearGradient
                          colors={getControlGradient("panLeft")!}
                          locations={[0, 0.34, 1]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.controlFill}
                        />
                      ) : null}
                      <Text style={[styles.directionButtonText, getControlGradient("panLeft") ? styles.zoomButtonTextActive : null]}>←</Text>
                    </Pressable>
                    <Pressable
                      onPressIn={() => {
                        runMobileControlAction("panRight", () => nudgeViewport(-CONTROL_NUDGE, 0));
                      }}
                      onPressOut={() => clearMobileControlPressLater("panRight")}
                      style={[styles.zoomButton, styles.mobileControlButton]}
                      {...webPressableProps}
                    >
                      {getControlGradient("panRight") ? (
                        <LinearGradient
                          colors={getControlGradient("panRight")!}
                          locations={[0, 0.34, 1]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.controlFill}
                        />
                      ) : null}
                      <Text style={[styles.directionButtonText, getControlGradient("panRight") ? styles.zoomButtonTextActive : null]}>→</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <View style={styles.zoomControls}>
                <Pressable
                  onPress={Platform.OS === "web" ? () => applyZoom(clamp(zoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)) : undefined}
                  onHoverIn={() => setHoveredControl("zoomIn")}
                  onHoverOut={() => setHoveredControl((current) => (current === "zoomIn" ? null : current))}
                  onPressIn={() => {
                    if (isNativeMobile) {
                      runMobileControlAction("zoomIn", () => applyZoom(clamp(zoomRef.current + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)));
                    } else {
                      setPressedControl("zoomIn");
                    }
                  }}
                  onPressOut={() => {
                    if (isNativeMobile) {
                      clearMobileControlPressLater("zoomIn");
                    } else {
                      setPressedControl((current) => (current === "zoomIn" ? null : current));
                    }
                  }}
                  style={[
                    isNativeMobile ? styles.zoomButton : styles.zoomButtonShell,
                    isNativeMobile ? styles.mobileControlButton : null,
                    !canZoomIn ? styles.zoomButtonDisabled : null,
                  ]}
                  disabled={!canZoomIn}
                  {...webPressableProps}
                >
                  {getControlGradient("zoomIn") ? (
                    <LinearGradient
                      colors={getControlGradient("zoomIn")!}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={isNativeMobile ? styles.controlFill : styles.zoomButtonGradient}
                    />
                  ) : null}
                  {isNativeMobile ? null : (
                    <View style={[styles.zoomButtonInner, getControlGradient("zoomIn") ? styles.zoomButtonInnerActive : null]}>
                      <Text
                        style={[
                          styles.zoomButtonText,
                          styles.zoomButtonTextPlus,
                          getControlGradient("zoomIn") ? styles.zoomButtonTextActive : null,
                        ]}
                      >
                        +
                      </Text>
                    </View>
                  )}
                  {isNativeMobile ? (
                    <Text
                      style={[
                        styles.zoomButtonText,
                        styles.zoomButtonTextPlus,
                        getControlGradient("zoomIn") ? styles.zoomButtonTextActive : null,
                      ]}
                    >
                      +
                    </Text>
                  ) : null}
                </Pressable>
                <Pressable
                  onPress={Platform.OS === "web" ? () => applyZoom(clamp(zoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)) : undefined}
                  onHoverIn={() => setHoveredControl("zoomOut")}
                  onHoverOut={() => setHoveredControl((current) => (current === "zoomOut" ? null : current))}
                  onPressIn={() => {
                    if (isNativeMobile) {
                      runMobileControlAction("zoomOut", () => applyZoom(clamp(zoomRef.current - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)));
                    } else {
                      setPressedControl("zoomOut");
                    }
                  }}
                  onPressOut={() => {
                    if (isNativeMobile) {
                      clearMobileControlPressLater("zoomOut");
                    } else {
                      setPressedControl((current) => (current === "zoomOut" ? null : current));
                    }
                  }}
                  style={[
                    isNativeMobile ? styles.zoomButton : styles.zoomButtonShell,
                    isNativeMobile ? styles.mobileControlButton : null,
                    !canZoomOut ? styles.zoomButtonDisabled : null,
                  ]}
                  disabled={!canZoomOut}
                  {...webPressableProps}
                >
                  {getControlGradient("zoomOut") ? (
                    <LinearGradient
                      colors={getControlGradient("zoomOut")!}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={isNativeMobile ? styles.controlFill : styles.zoomButtonGradient}
                    />
                  ) : null}
                  {isNativeMobile ? null : (
                    <View style={[styles.zoomButtonInner, getControlGradient("zoomOut") ? styles.zoomButtonInnerActive : null]}>
                      <Text
                        style={[
                          styles.zoomButtonText,
                          styles.zoomButtonTextMinus,
                          getControlGradient("zoomOut") ? styles.zoomButtonTextActive : null,
                        ]}
                      >
                        −
                      </Text>
                    </View>
                  )}
                  {isNativeMobile ? (
                    <Text
                      style={[
                        styles.zoomButtonText,
                        styles.zoomButtonTextMinus,
                        getControlGradient("zoomOut") ? styles.zoomButtonTextActive : null,
                      ]}
                    >
                      −
                    </Text>
                  ) : null}
                </Pressable>
              </View>
              {isNativeMobile && yearOptions.length > 0 && onChangeYear ? (
                <View style={styles.mobileYearControlWrap}>
                  <Pressable
                    onPress={() => setIsYearMenuOpen((current) => !current)}
                    onPressIn={() => setPressedControl("year")}
                    onPressOut={() => setPressedControl((current) => (current === "year" ? null : current))}
                    style={[styles.mapActionButtonShell, styles.mobileWideButtonShell]}
                    {...webPressableProps}
                  >
                    {getControlGradient("year") ? (
                      <LinearGradient
                        colors={getControlGradient("year")!}
                        locations={[0, 0.34, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.mapActionButtonGradient}
                      />
                    ) : null}
                    <View style={[styles.mapActionButton, styles.mobileSolidActionButton, styles.mapActionButtonActive]}>
                      <Text style={[styles.mapActionButtonText, styles.mobileWideButtonText, styles.mapActionButtonTextActive]}>
                        {`${selectedYear} ${isYearMenuOpen ? "▴" : "▾"}`}
                      </Text>
                    </View>
                  </Pressable>
                  {isYearMenuOpen ? (
                    <View style={styles.mobileYearMenu}>
                      <ScrollView style={styles.mobileYearMenuScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        {yearOptions.map((yearOption) => (
                          <Pressable
                            key={`map-year-option-${yearOption}`}
                            onPress={() => {
                              onChangeYear(yearOption);
                              setIsYearMenuOpen(false);
                            }}
                            style={[styles.mapActionButtonShell, styles.mobileWideButtonShell]}
                          >
                            <View style={[styles.mapActionButton, styles.mobileSolidActionButton, yearOption === selectedYear ? styles.mapActionButtonActive : null]}>
                              {yearOption === selectedYear ? (
                                <LinearGradient
                                  colors={CONTROL_ACTIVE_GRADIENT}
                                  locations={[0, 0.34, 1]}
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={styles.mapActionButtonGradient}
                                />
                              ) : null}
                              <Text
                                style={[
                                  styles.mapActionButtonText,
                                  styles.mobileWideButtonText,
                                  yearOption === selectedYear ? styles.mapActionButtonTextActive : null,
                                ]}
                              >
                                {yearOption}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {onFiltersPress ? (
                <Pressable
                  onPress={() => {
                    setIsYearMenuOpen(false);
                    onFiltersPress();
                  }}
                  onHoverIn={() => setHoveredControl("filters")}
                  onHoverOut={() => setHoveredControl((current) => (current === "filters" ? null : current))}
                  onPressIn={() => setPressedControl("filters")}
                  onPressOut={() => setPressedControl((current) => (current === "filters" ? null : current))}
                  style={[styles.mapActionButtonShell, isNativeMobile ? styles.mobileWideButtonShell : null]}
                  {...webPressableProps}
                >
                  {getControlGradient("filters") ? (
                    <LinearGradient
                      colors={getControlGradient("filters")!}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.mapActionButtonGradient}
                    />
                  ) : null}
                  <View style={[styles.mapActionButton, isNativeMobile ? styles.mobileSolidActionButton : null, getControlGradient("filters") ? styles.mapActionButtonActive : null]}>
                      <Text
                        style={[
                          styles.mapActionButtonText,
                          isNativeMobile ? styles.mobileWideButtonText : null,
                          getControlGradient("filters") ? styles.mapActionButtonTextActive : null,
                        ]}
                      >
                        All Filters
                      </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>

            {(isNativeMobile || !isViewportAtDefault) ? (
              <Pressable
                onPress={Platform.OS === "web" ? () => {
                  setOffset(DEFAULT_OFFSET);
                  setZoom(DEFAULT_ZOOM);
                } : undefined}
                onPressIn={() => {
                  if (isNativeMobile) {
                    runMobileControlAction("reset", () => {
                      setOffset(DEFAULT_OFFSET);
                      setZoom(DEFAULT_ZOOM);
                    });
                  }
                }}
                onPressOut={() => {
                  if (isNativeMobile) {
                    clearMobileControlPressLater("reset");
                  }
                }}
                style={[styles.infoChip, styles.infoChipRight, getControlGradient("reset") ? styles.infoChipPressed : null]}
                {...webPressableProps}
              >
                {getControlGradient("reset") ? (
                  <LinearGradient
                    colors={getControlGradient("reset")!}
                    locations={[0, 0.34, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.infoChipFill}
                  />
                ) : null}
                <Text style={[styles.infoChipText, getControlGradient("reset") ? styles.infoChipTextPressed : null]}>Reset</Text>
              </Pressable>
            ) : null}

          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  globeArea: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    minHeight: 500,
    backgroundColor: "transparent",
  },
  scene: {
    position: "relative",
  },
  sceneInner: {
    position: "absolute",
    left: 0,
    top: 0,
    width: BASE_MAP_SIZE,
    height: BASE_SCENE_HEIGHT,
    transformOrigin: "top left" as any,
  },
  mapViewport: {
    position: "absolute",
    left: 0,
    top: MAP_TOP,
    width: BASE_MAP_SIZE,
    height: MAP_VIEWPORT_HEIGHT,
    borderRadius: 0,
    borderWidth: 0,
    overflow: "hidden",
    backgroundColor: colors.background,
    shadowColor: colors.shadow,
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 0,
  },
  mapViewportMobile: {
    height: MAP_VIEWPORT_HEIGHT + MOBILE_HELPER_INFO_PANEL_HEIGHT,
  },
  oceanFill: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundBlendPrimary: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundBlendSecondary: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundBlendDepth: {
    ...StyleSheet.absoluteFillObject,
  },
  infoPanelShell: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    borderWidth: 0,
    zIndex: 64,
    elevation: 64,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : null),
    minHeight: 58,
    height: 58,
  },
  infoPanelShellMobile: {
    height: MOBILE_HELPER_INFO_PANEL_HEIGHT,
  },
  infoPanelFill: {
    ...StyleSheet.absoluteFillObject,
  },
  infoPanelShellInteractive: {
    opacity: 1,
  },
  infoPanelContent: {
    paddingHorizontal: 12,
    paddingTop: 5,
    paddingBottom: 5,
    zIndex: 2,
    elevation: 2,
  },
  infoPanelContentMobile: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  infoPanelHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 0,
    minHeight: 14,
  },
  infoPanelHeadingRowMobile: {
    minHeight: 30,
  },
  infoPanelHeadingLine: {
    width: "100%",
    height: 2,
    borderRadius: 999,
    marginTop: 6,
    marginLeft: 1,
    backgroundColor: "rgba(240,232,241,0.82)",
  },
  infoPanelBodyWrap: {
    minHeight: 16,
    maxHeight: 16,
    marginTop: 7,
    justifyContent: "flex-start",
    paddingTop: 0,
  },
  infoPanelBodyWrapMobile: {
    minHeight: 92,
    maxHeight: 92,
    marginTop: 12,
  },
  infoPanelHeading: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 14,
    flexShrink: 1,
    minWidth: 0,
    textShadowColor: "rgba(15,16,21,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoPanelHeadingMobile: {
    fontSize: 22,
    lineHeight: 26,
  },
  infoPanelStatsWrap: {
    gap: 2,
  },
  infoPanelBulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  infoPanelBody: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 8,
    lineHeight: 9,
    flex: 1,
  },
  infoPanelBodyMobile: {
    fontSize: 17,
    lineHeight: 22,
  },
  infoPanelButton: {
    minHeight: 18,
    minWidth: 52,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(15, 16, 21, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(212, 224, 249, 0.1)",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web"
      ? ({
          userSelect: "none",
        } as any)
      : null),
  },
  controlFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  zoomButtonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9,
  },
  infoPanelButtonText: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 9,
    lineHeight: 9,
    fontWeight: "700",
    zIndex: 1,
  },
  svgViewport: {
    position: "absolute",
    left: 0,
    top: SVG_OFFSET_Y,
    width: BASE_MAP_SIZE,
    height: BASE_SCENE_HEIGHT,
  },
  svgViewportMobile: {
    top: MOBILE_HELPER_INFO_PANEL_HEIGHT,
  },
  mapControlStack: {
    position: "absolute",
    bottom: 8,
    left: 12,
    gap: 4,
    zIndex: 48,
    elevation: 48,
  },
  directionPad: {
    gap: 4,
    marginBottom: 2,
    width: 88,
  },
  directionPadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  directionPadSpacer: {
    width: 28,
    height: 28,
  },
  mapActionButtonShell: {
    width: 60,
    minWidth: 60,
    position: "relative",
    borderRadius: 9,
    overflow: "hidden",
  },
  mobileWideButtonShell: {
    width: 88,
    minWidth: 88,
  },
  mapActionButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  mapActionButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "transparent",
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  mapActionButtonActive: {
    backgroundColor: "transparent",
  },
  mapActionButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  mobileWideButtonText: {
    fontSize: 12,
    lineHeight: 13,
  },
  mapActionButtonTextActive: {
    color: colors.textLight,
  },
  mobileSolidActionButton: {
    backgroundColor: colors.button,
    minHeight: 38,
  },
  zoomControls: {
    flexDirection: "row",
    gap: 4,
  },
  zoomButtonShell: {
    width: 28,
    height: 28,
    borderRadius: 9,
    position: "relative",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          userSelect: "none",
        } as any)
      : null),
  },
  zoomButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(15, 16, 21, 0.16)",
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    ...(Platform.OS === "web"
      ? ({
          userSelect: "none",
        } as any)
      : null),
  },
  zoomButtonInner: {
    width: "100%",
    height: "100%",
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  zoomButtonInnerActive: {
    backgroundColor: "transparent",
  },
  mobileControlButton: {
    width: 42,
    height: 38,
    borderRadius: 10,
  },
  zoomButtonDisabled: {
    opacity: 0.42,
  },
  zoomButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 24,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
    zIndex: 1,
    ...(Platform.OS === "web"
      ? ({
          userSelect: "none",
        } as any)
      : null),
  },
  zoomButtonTextPlus: {
    transform: [{ translateY: 1 }],
  },
  zoomButtonTextMinus: {
    transform: [{ translateY: 1 }],
    fontSize: 25,
    lineHeight: 25,
  },
  zoomButtonTextActive: {
    color: colors.textLight,
  },
  directionButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: "700",
    zIndex: 1,
  },
  mobileYearControlWrap: {
    position: "relative",
    zIndex: 30,
    elevation: 30,
  },
  mobileYearMenu: {
    position: "absolute",
    left: 0,
    bottom: 42,
    zIndex: 32,
    elevation: 32,
    maxHeight: 172,
    padding: 6,
    borderRadius: 12,
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  mobileYearMenuScroll: {
    maxHeight: 160,
  },
  infoChip: {
    position: "absolute",
    bottom: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(15, 16, 21, 0.24)",
    borderWidth: 1,
    borderColor: "rgba(212, 224, 249, 0.1)",
    ...(Platform.OS === "web"
      ? ({
          userSelect: "none",
        } as any)
      : null),
    overflow: "hidden",
  },
  infoChipFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
  infoChipPressed: {
    borderColor: colors.textLight,
    transform: [{ scale: 0.98 }],
  },
  infoChipText: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 10,
    lineHeight: 11,
    zIndex: 1,
  },
  infoChipTextPressed: {
    color: colors.textLight,
  },
  infoChipRight: {
    position: "absolute",
    bottom: 12,
    right: 12,
    left: "auto",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
