import { LinearGradient } from "expo-linear-gradient";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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
  selectedCountryIds?: string[];
  selectedYear?: number;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
  onFiltersPress?: () => void;
  selectOnHover?: boolean;
  genreSummaryByCountryCode?: Record<string, string | undefined>;
  genreLoadingByCountryCode?: Record<string, boolean | undefined>;
  loadingText?: string;
  onEnsureGenreSample?: (countryCode: string) => void;
};

type ViewportOffset = {
  x: number;
  y: number;
};

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
const COUNTRY_STROKE = "rgba(169, 176, 209, 0.22)";
const ACTIVE_COUNTRY_STROKE = "rgba(240, 232, 241, 0.88)";
const ACTIVE_COUNTRY_GLOW = "rgba(15, 16, 21, 0.52)";
const HOVER_COUNTRY_GLOW = "rgba(15, 16, 21, 0.42)";
const COMPARISON_PRIMARY = "#C488A3";
const COMPARISON_SECONDARY = "#88A8D8";
const INTERACTION_SUPPRESS_MS = 140;
const MAP_GUIDE_COPY =
  "Hover over a country to view its stat card, use the Timeline slider below the map to change the displayed year, click a country to view its detail page, or utilize Comparison Mode in the main navigation.";

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

export function GlobeView({
  countries,
  allCountries,
  activeCountry,
  selectedCountryIds,
  selectedYear,
  onSelectCountry,
  onOpenCountry,
  onFiltersPress,
  selectOnHover = true,
  genreSummaryByCountryCode,
  genreLoadingByCountryCode,
  loadingText = "Loading...",
  onEnsureGenreSample,
}: Props) {
  const { width } = useWindowDimensions();
  const [hoveredControl, setHoveredControl] = useState<"zoomIn" | "zoomOut" | "filters" | null>(null);
  const [pressedControl, setPressedControl] = useState<"zoomIn" | "zoomOut" | "filters" | null>(null);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [focusedCountryId, setFocusedCountryId] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [offset, setOffset] = useState<ViewportOffset>(DEFAULT_OFFSET);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverSelectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverSyncFrameRef = useRef<number | null>(null);
  const hoveredCountryIdRef = useRef<string | null>(null);
  const offsetStartRef = useRef<ViewportOffset>(DEFAULT_OFFSET);
  const offsetRef = useRef<ViewportOffset>(DEFAULT_OFFSET);
  const zoomRef = useRef(DEFAULT_ZOOM);
  const isDraggingRef = useRef(false);
  const suppressInteractionsUntilRef = useRef(0);
  const fallbackWidth = Math.max(316, Math.min(760, width - 30));
  const sceneWidth = containerWidth > 0 ? Math.max(316, containerWidth) : fallbackWidth;
  const sceneScale = sceneWidth / BASE_MAP_SIZE;
  const sceneHeight = BASE_SCENE_HEIGHT * sceneScale;
  const mapCountries = allCountries && allCountries.length > 0 ? allCountries : countries;
  const countryByCode = useMemo(
    () => new Map(mapCountries.map((country) => [country.code.trim().toUpperCase(), country])),
    [mapCountries]
  );
  const hoveredOrFocusedCountryId = hoveredCountryId ?? focusedCountryId;
  const cardCountry = mapCountries.find((country) => country.id === hoveredOrFocusedCountryId) ?? null;
  const hasHiddenGems = (cardCountry?.hiddenSongs ?? 0) > 0;
  const selectedYearLabel = selectedYear ?? "this year";
  const noHiddenGemsCopy = selectedYear ? `No Hidden Gems for ${selectedYear}` : "No Hidden Gems for this year";
  const hasNoSongData =
    cardCountry ? cardCountry.album === "Unknown Album" && cardCountry.albumArtist === "Unknown Artist" : false;
  const noSongDataCopy = selectedYear ? `No song data for ${selectedYear}` : "No song data for this year";
  const showInfoPanel = Boolean(onFiltersPress);
  const webPressableProps =
    Platform.OS === "web"
      ? ({
          onMouseDown: (event: any) => event.preventDefault(),
        } as any)
      : {};
  const getControlGradient = (control: "zoomIn" | "zoomOut" | "filters") => {
    if (control === "filters") {
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

    if (Platform.OS === "web") {
      triggerPrimaryAction(country.id);
      return;
    }

    if (focusedCountryId === country.id) {
      triggerPrimaryAction(country.id);
      return;
    }

    setFocusedCountryId(country.id);
    onSelectCountry(country.id);
  };

  const applyZoom = (nextZoom: number) => {
    setZoom(nextZoom);
    setOffset((current) => clampOffset(current, nextZoom));
  };

  const viewBoxWidth = BASE_MAP_SIZE / zoom;
  const viewBoxHeight = BASE_SCENE_HEIGHT / zoom;
  const viewBoxX = BASE_CENTER_X - viewBoxWidth / 2 - offset.x / zoom;
  const viewBoxY = BASE_CENTER_Y - viewBoxHeight / 2 - offset.y / zoom;
  const baseStrokeWidth = zoom <= 1.2 ? 0.28 : zoom <= 1.8 ? 0.34 : zoom <= 2.6 ? 0.42 : 0.5;
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
  const handleGlobeAreaLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  };

  return (
    <View style={[styles.globeArea, { minHeight: sceneHeight }]} onLayout={handleGlobeAreaLayout}>
      <View style={[styles.scene, { width: sceneWidth, height: sceneHeight }]}>
        <View style={[styles.sceneInner, { transform: [{ scale: sceneScale }] }]}>
          <View
            style={styles.mapViewport}
            {...panResponder.panHandlers}
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
              <View style={styles.infoPanelShell}>
                <LinearGradient
                  colors={["rgba(117,82,107,0.24)", "rgba(108,119,142,0.12)", "rgba(44,46,75,0.28)"]}
                  locations={[0, 0.36, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.infoPanelFill}
                />
                <View style={styles.infoPanelContent}>
                  <View style={styles.infoPanelMainRow}>
                    <View style={styles.infoPanelCopyColumn}>
                      <View style={styles.infoPanelToggle}>
                        <View style={styles.infoPanelHeadingRow}>
                          {cardCountry ? (
                            <Text style={styles.infoPanelHeading}>{`${cardCountry.name} in ${selectedYearLabel}:`}</Text>
                          ) : (
                            <>
                              <Text style={styles.infoPanelHeading}>Discovery Map</Text>
                              <GemIcon size={11} />
                            </>
                          )}
                        </View>
                        <View style={styles.infoPanelHeadingLine} />
                      </View>
                      <View style={styles.infoPanelBodyWrap}>
                        {hoveredCountryStats ? (
                          <View style={styles.infoPanelStatsWrap}>
                            {hoveredCountryStats.map((line) => (
                              <View key={line} style={styles.infoPanelBulletRow}>
                                <GemIcon size={7} />
                                <Text style={styles.infoPanelBody} numberOfLines={1}>
                                  {line}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.infoPanelBody}>{MAP_GUIDE_COPY}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.svgViewport}>
              <Svg
                width={BASE_MAP_SIZE}
                height={BASE_SCENE_HEIGHT}
                viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
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
                {worldMapCountries.map((shape) => {
                  const linkedCountry = shape.code ? countryByCode.get(shape.code) : undefined;
                  const isHovered = Boolean(linkedCountry && hoveredCountryId === linkedCountry.id);
                  const isFocusedCountry = Boolean(linkedCountry && focusedCountryId === linkedCountry.id);
                  const comparisonColor = linkedCountry ? getSelectionColor(linkedCountry.id, selectedCountryIds) : null;
                  const hasMapData = Boolean(linkedCountry);
                  const canInteract = hasMapData;
                  const showGlow = Boolean(comparisonColor || isHovered || isFocusedCountry);
                  const glowColor = comparisonColor ?? (isHovered ? HOVER_COUNTRY_GLOW : ACTIVE_COUNTRY_GLOW);
                  const fill = comparisonColor
                    ? `${comparisonColor}DD`
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

                  return (
                    <Fragment key={`country-shape-group-${shape.id}`}>
                      {showGlow ? (
                        <>
                          <Path
                            key={`country-shape-glow-outer-${shape.id}`}
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
                            key={`country-shape-glow-inner-${shape.id}`}
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
                        key={`country-shape-${shape.id}`}
                        d={shape.path}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={comparisonColor ? baseStrokeWidth + 0.08 : isHovered || isFocusedCountry ? baseStrokeWidth + 0.04 : baseStrokeWidth}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        onPress={canInteract && linkedCountry ? () => handleMapCountryPress(linkedCountry) : undefined}
                        {...(Platform.OS === "web" && linkedCountry
                          ? ({
                              onMouseEnter: () => handleCountryPreview(linkedCountry),
                              onMouseLeave: () => clearHoverLater(linkedCountry.id),
                              cursor: "pointer",
                            } as any)
                          : null)}
                      />
                    </Fragment>
                  );
                })}

                {worldMapContinentOutlines.map((outline) => (
                  <Path
                    key={`continent-${outline.id}`}
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
              {onFiltersPress ? (
                <Pressable
                  onPress={onFiltersPress}
                  onHoverIn={() => setHoveredControl("filters")}
                  onHoverOut={() => setHoveredControl((current) => (current === "filters" ? null : current))}
                  onPressIn={() => setPressedControl("filters")}
                  onPressOut={() => setPressedControl((current) => (current === "filters" ? null : current))}
                  style={styles.mapActionButtonShell}
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
                  <View style={[styles.mapActionButton, getControlGradient("filters") ? styles.mapActionButtonActive : null]}>
                    <Text style={[styles.mapActionButtonText, getControlGradient("filters") ? styles.mapActionButtonTextActive : null]}>
                      All Filters
                    </Text>
                  </View>
                </Pressable>
              ) : null}
              <View style={styles.zoomControls}>
                <Pressable
                  onPress={() => applyZoom(clamp(zoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
                  onHoverIn={() => setHoveredControl("zoomIn")}
                  onHoverOut={() => setHoveredControl((current) => (current === "zoomIn" ? null : current))}
                  onPressIn={() => setPressedControl("zoomIn")}
                  onPressOut={() => setPressedControl((current) => (current === "zoomIn" ? null : current))}
                  style={[styles.zoomButton, !canZoomIn ? styles.zoomButtonDisabled : null]}
                  disabled={!canZoomIn}
                  {...webPressableProps}
                >
                  {getControlGradient("zoomIn") ? (
                    <LinearGradient
                      colors={getControlGradient("zoomIn")!}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.controlFill}
                    />
                  ) : null}
                  <Text style={[styles.zoomButtonText, getControlGradient("zoomIn") ? styles.zoomButtonTextActive : null]}>+</Text>
                </Pressable>
                <Pressable
                  onPress={() => applyZoom(clamp(zoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
                  onHoverIn={() => setHoveredControl("zoomOut")}
                  onHoverOut={() => setHoveredControl((current) => (current === "zoomOut" ? null : current))}
                  onPressIn={() => setPressedControl("zoomOut")}
                  onPressOut={() => setPressedControl((current) => (current === "zoomOut" ? null : current))}
                  style={[styles.zoomButton, !canZoomOut ? styles.zoomButtonDisabled : null]}
                  disabled={!canZoomOut}
                  {...webPressableProps}
                >
                  {getControlGradient("zoomOut") ? (
                    <LinearGradient
                      colors={getControlGradient("zoomOut")!}
                      locations={[0, 0.34, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.controlFill}
                    />
                  ) : null}
                  <Text style={[styles.zoomButtonText, getControlGradient("zoomOut") ? styles.zoomButtonTextActive : null]}>-</Text>
                </Pressable>
              </View>
            </View>

            {(Math.abs(offset.x) > 0.8 || Math.abs(offset.y) > 0.8 || Math.abs(zoom - DEFAULT_ZOOM) > 0.02) ? (
              <Pressable
                onPress={() => {
                  setOffset(DEFAULT_OFFSET);
                  setZoom(DEFAULT_ZOOM);
                }}
                style={[styles.infoChip, styles.infoChipRight]}
                {...webPressableProps}
              >
                <Text style={styles.infoChipText}>Reset</Text>
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
    zIndex: 24,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : null),
    minHeight: 58,
    height: 58,
  },
  infoPanelFill: {
    ...StyleSheet.absoluteFillObject,
  },
  infoPanelContent: {
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 0,
  },
  infoPanelMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 0,
  },
  infoPanelCopyColumn: {
    flex: 1,
    minWidth: 0,
  },
  infoPanelToggle: {
    flex: 1,
    minWidth: 0,
    ...(Platform.OS === "web"
      ? ({
          userSelect: "none",
        } as any)
      : null),
  },
  infoPanelHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  infoPanelHeadingLine: {
    width: "100%",
    height: 2,
    borderRadius: 999,
    marginTop: 3,
    marginLeft: 1,
    backgroundColor: colors.backgroundBottom,
  },
  infoPanelBodyWrap: {
    minHeight: 16,
    maxHeight: 16,
    marginTop: 7,
    justifyContent: "flex-start",
    paddingTop: 0,
  },
  infoPanelHeading: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 12,
    lineHeight: 14,
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
  mapControlStack: {
    position: "absolute",
    bottom: 8,
    left: 12,
    gap: 4,
    zIndex: 16,
  },
  mapActionButtonShell: {
    width: 60,
    minWidth: 60,
    position: "relative",
    borderRadius: 9,
    overflow: "hidden",
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
  mapActionButtonTextActive: {
    color: colors.textLight,
  },
  zoomControls: {
    flexDirection: "row",
    gap: 4,
  },
  zoomButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.button,
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
  zoomButtonDisabled: {
    opacity: 0.42,
  },
  zoomButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "700",
    transform: [{ translateY: -1 }],
    zIndex: 1,
    ...(Platform.OS === "web"
      ? ({
          userSelect: "none",
        } as any)
      : null),
  },
  zoomButtonTextActive: {
    color: colors.textLight,
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
  },
  infoChipText: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 10,
    lineHeight: 11,
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
