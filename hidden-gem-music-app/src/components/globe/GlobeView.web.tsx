import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";

import { GemIcon } from "../GemIcon";
import { Country } from "../../types/content";
import { colors } from "../../theme/colors";
import { typefaces } from "../../theme/typography";

type Props = {
  countries: Country[];
  activeCountry?: Country;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
  selectOnHover?: boolean;
};

export function GlobeView({ countries, activeCountry, onSelectCountry, onOpenCountry, selectOnHover = true }: Props) {
  const { width } = useWindowDimensions();
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneSize = Math.max(320, Math.min(440, width - 110));
  const sceneInset = (sceneSize - 400) / 2;
  const sceneScale = sceneSize / 400;
  const hoveredCountry = countries.find((country) => country.id === hoveredCountryId) ?? null;
  const tooltipWidth = 226;
  const tooltipHeight = 132;
  const markerX = hoveredCountry ? (parseFloat(hoveredCountry.markerLeft) / 100) * 400 : 0;
  const markerY = hoveredCountry ? (parseFloat(hoveredCountry.markerTop) / 100) * 400 : 0;
  const markerRadius = hoveredCountryId ? 15 : 12;
  const cornerOverlap = 8;
  const placeCardLeft = markerX > 216;
  const tooltipLeft = placeCardLeft
    ? Math.max(16, markerX - tooltipWidth + markerRadius - cornerOverlap)
    : Math.min(400 - tooltipWidth - 16, markerX - markerRadius + cornerOverlap);
  const tooltipTop = Math.min(
    Math.max(16, markerY - tooltipHeight + markerRadius - cornerOverlap),
    400 - tooltipHeight - 16
  );
  const tooltipAnchorX = placeCardLeft ? tooltipLeft + tooltipWidth : tooltipLeft;
  const tooltipAnchorY = tooltipTop + tooltipHeight;
  const connectorDx = tooltipAnchorX - markerX;
  const connectorDy = tooltipAnchorY - markerY;
  const connectorLength = Math.sqrt(connectorDx * connectorDx + connectorDy * connectorDy);
  const connectorAngle = `${Math.atan2(connectorDy, connectorDx)}rad`;

  return (
    <View style={styles.globeArea}>
      <View style={[styles.scene, { width: sceneSize, height: sceneSize }]}>
        <View style={[styles.sceneInner, { left: sceneInset, top: sceneInset, transform: [{ scale: sceneScale }] }]}>
          <View style={styles.globeShadow} />

          <View style={styles.globe}>
            <View style={styles.cloudBand} />
            <View style={styles.auroraGlow} />
            <View style={styles.continentNorthAmerica} />
            <View style={styles.continentSouthAmerica} />
            <View style={styles.continentEurope} />
            <View style={styles.continentAfrica} />

            {countries.map((country) => (
              <Pressable
                key={country.id}
                hitSlop={8}
                onPress={() => onSelectCountry(country.id)}
                onHoverIn={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                  setHoveredCountryId(country.id);
                  if (selectOnHover) {
                    onSelectCountry(country.id);
                  }
                }}
                onHoverOut={() => {
                  hoverTimeoutRef.current = setTimeout(() => {
                    setHoveredCountryId((current) => (current === country.id ? null : current));
                    hoverTimeoutRef.current = null;
                  }, 60);
                }}
                style={[
                  styles.marker,
                  { top: country.markerTop as any, left: country.markerLeft as any },
                  hoveredCountryId === country.id ? styles.markerActive : null,
                ]}
              >
                <GemIcon size={hoveredCountryId === country.id ? 30 : 24} />
              </Pressable>
            ))}
          </View>

          {hoveredCountry ? (
            <>
              <View
                style={[
                  styles.connector,
                  {
                    width: connectorLength,
                    left: markerX,
                    top: markerY,
                    transform: [{ rotate: connectorAngle }],
                  },
                ]}
              />

              <Pressable
                onPress={() => {
                  if (onOpenCountry) {
                    onOpenCountry(hoveredCountry.id);
                    return;
                  }

                  onSelectCountry(hoveredCountry.id);
                }}
                onHoverIn={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                  setHoveredCountryId(hoveredCountry.id);
                  if (selectOnHover) {
                    onSelectCountry(hoveredCountry.id);
                  }
                }}
                onHoverOut={() => {
                  hoverTimeoutRef.current = setTimeout(() => {
                    setHoveredCountryId((current) => (current === hoveredCountry.id ? null : current));
                    hoverTimeoutRef.current = null;
                  }, 60);
                }}
                style={[styles.tooltip, { left: tooltipLeft, top: tooltipTop, width: tooltipWidth }]}
              >
                <View style={styles.tooltipInner}>
                  <View style={styles.tooltipHeader}>
                    <Text style={styles.tooltipCountry}>{hoveredCountry.name}</Text>
                    <Text style={styles.tooltipRegion}>{hoveredCountry.region}</Text>
                  </View>
                  <View style={styles.tooltipDivider} />
                  <View style={styles.tooltipBody}>
                    <Text style={styles.tooltipCopy}>Hidden Songs: {hoveredCountry.hiddenSongs}</Text>
                    <Text style={styles.tooltipCopy}>Most Popular Genres: {hoveredCountry.genres.join(", ")}</Text>
                    <Text style={styles.tooltipCopy}>
                      Most Popular Album: {hoveredCountry.album} by {hoveredCountry.albumArtist}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  globeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 520,
    backgroundColor: "transparent",
  },
  scene: {
    position: "relative",
  },
  sceneInner: {
    position: "absolute",
    width: 400,
    height: 400,
  },
  globeShadow: {
    position: "absolute",
    left: 24,
    top: 36,
    width: 352,
    height: 352,
    borderRadius: 176,
    backgroundColor: "rgba(0, 0, 0, 0.26)",
    opacity: 0.56,
    transform: [{ scaleX: 1.08 }],
    ...(Platform.OS === "web"
      ? ({
          filter: "blur(28px)",
        } as ViewStyle)
      : {
          shadowColor: colors.shadow,
          shadowOpacity: 0.22,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 24 },
          elevation: 0,
        }),
  },
  globe: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#173982",
    borderWidth: 3,
    borderColor: "#f3f7ff",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  cloudBand: {
    position: "absolute",
    top: 20,
    left: 10,
    right: 10,
    height: 138,
    borderRadius: 120,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  auroraGlow: {
    position: "absolute",
    top: 52,
    left: 56,
    width: 180,
    height: 78,
    borderRadius: 90,
    backgroundColor: "rgba(120, 187, 123, 0.18)",
    transform: [{ rotate: "-12deg" }],
  },
  continentNorthAmerica: {
    position: "absolute",
    top: 76,
    left: 66,
    width: 156,
    height: 146,
    borderRadius: 112,
    backgroundColor: "#6ba451",
    transform: [{ rotate: "-18deg" }],
  },
  continentSouthAmerica: {
    position: "absolute",
    top: 188,
    left: 164,
    width: 92,
    height: 168,
    borderRadius: 90,
    backgroundColor: "#b48a43",
    transform: [{ rotate: "14deg" }],
  },
  continentEurope: {
    position: "absolute",
    top: 110,
    left: 258,
    width: 84,
    height: 64,
    borderRadius: 44,
    backgroundColor: "#679844",
    transform: [{ rotate: "-8deg" }],
  },
  continentAfrica: {
    position: "absolute",
    top: 170,
    left: 266,
    width: 80,
    height: 118,
    borderRadius: 60,
    backgroundColor: "#8ca253",
    transform: [{ rotate: "7deg" }],
  },
  marker: {
    position: "absolute",
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -22,
    marginTop: -22,
    zIndex: 8,
  },
  markerActive: {
    transform: [{ scale: 1.06 }],
  },
  connector: {
    position: "absolute",
    height: 2,
    backgroundColor: colors.navGradient,
    transformOrigin: "0 0" as any,
  },
  tooltip: {
    position: "absolute",
    borderWidth: 4,
    borderColor: colors.border,
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 6,
  },
  tooltipInner: {
    paddingVertical: 0,
  },
  tooltipHeader: {
    backgroundColor: colors.globeCardTop,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 4,
  },
  tooltipBody: {
    backgroundColor: colors.globeCardBottom,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 6,
  },
  tooltipCountry: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 20,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  tooltipRegion: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    fontWeight: "700",
  },
  tooltipDivider: {
    height: 4,
    width: "100%",
    backgroundColor: colors.border,
  },
  tooltipCopy: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },
});
