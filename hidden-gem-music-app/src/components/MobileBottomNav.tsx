import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { GemIcon } from "./GemIcon";

const mobileNavItems: Array<{ label: string; route: ScreenRoute }> = [
  { label: "Discovery Globe", route: "discovery" },
  { label: "Compare", route: "comparisonSelect" },
  { label: "Hidden Gems", route: "hiddenGems" },
  { label: "Dashboard", route: "dashboard" },
  { label: "Credits", route: "credits" },
];
const mobileSearchItem = { label: "Search", route: "search" as const };
const discoveryIconSource = require("../assets/images/discoveryglobeicon Background Removed.png");
const comparisonIconSource = require("../assets/images/comparisonmodeicon.png");
const hiddenGemsIconSource = require("../assets/images/hiddengemsicon.png");
const dashboardIconSource = require("../assets/images/dashboardicon.png");
const searchIconSource = require("../assets/images/searchicon.png");
const SHOW_MOBILE_NAV_ICONS = false;

type Props = {
  currentRoute: ScreenRoute;
  searchOpen: boolean;
  onNavigate: (route: ScreenRoute) => void;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
};

export function MobileBottomNav({ currentRoute, searchOpen, onNavigate, onToggleSearch, onCloseSearch }: Props) {
  const { width } = useWindowDimensions();
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});
  if (width >= 980) {
    return null;
  }

  const allItems = [...mobileNavItems, mobileSearchItem];
  const itemCount = allItems.length;
  const activeIndex = searchOpen
    ? itemCount - 1
    : Math.max(
        0,
        allItems.findIndex((item) => item.route === currentRoute)
      );
  const slotWidth = 100 / itemCount;
  const highlightWidth = slotWidth * 1.86;
  const centerPercent = (activeIndex + 0.5) * slotWidth;
  const highlightLeft = centerPercent - highlightWidth / 2;
  const isLeftEdge = activeIndex === 0;
  const isRightEdge = activeIndex === itemCount - 1;
  const edgeWidth = slotWidth * 2.05;
  const resolvedHighlightWidth = isLeftEdge || isRightEdge ? edgeWidth : highlightWidth;
  const resolvedHighlightLeft = isLeftEdge
    ? 0
    : isRightEdge
      ? 100 - edgeWidth
      : highlightLeft;
  const edgeGradientColors = isLeftEdge
    ? (["rgba(117,82,107,1)", "rgba(117,82,107,0.72)", "rgba(117,82,107,0)"] as const)
    : isRightEdge
      ? (["rgba(117,82,107,0)", "rgba(117,82,107,0.72)", "rgba(117,82,107,1)"] as const)
      : (["rgba(117,82,107,0)", "rgba(117,82,107,0.95)", "rgba(117,82,107,0)"] as const);
  const edgeGradientLocations = [0, 0.5, 1] as const;
  const formatLabel = (label: string) => (label.includes(" ") ? label.replace(" ", "\n") : label);

  return (
    <LinearGradient
      colors={["#7C8FB2", "#7C8FB2"]}
      locations={[0, 1]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.shell}
    >
      <View
        pointerEvents="none"
        style={[
          styles.activeGradientSlot,
          {
            width: `${resolvedHighlightWidth}%`,
            left: `${resolvedHighlightLeft}%`,
          },
        ]}
      >
        <LinearGradient
          colors={edgeGradientColors}
          locations={edgeGradientLocations}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.activeGradientFill}
        />
      </View>
      <View style={styles.row}>
        {mobileNavItems.map((item) => {
          const isActive = !searchOpen && currentRoute === item.route;
          const iconSource =
            item.route === "discovery"
              ? discoveryIconSource
              : item.route === "comparisonSelect"
                ? comparisonIconSource
                : item.route === "hiddenGems"
                  ? hiddenGemsIconSource
                  : item.route === "dashboard"
                    ? dashboardIconSource
                  : null;
          const customIconStyle =
            item.route === "hiddenGems"
              ? styles.customIconLarge
              : item.route === "dashboard"
                ? styles.customIconLarge
                : styles.customIcon;
          const iconDimStyle = isActive ? styles.iconActive : styles.iconDimmed;
          return (
            <Pressable
              key={item.route}
              onPress={() => {
                onCloseSearch();
                onNavigate(item.route);
              }}
              style={styles.item}
            >
              {SHOW_MOBILE_NAV_ICONS ? (
                <View style={styles.iconSlot}>
                  {iconSource ? (
                    <Image source={iconSource} style={[customIconStyle, iconDimStyle]} resizeMode="contain" />
                  ) : (
                    <GemIcon size={30} style={[styles.iconGem, iconDimStyle]} />
                  )}
                </View>
              ) : null}
              <View style={styles.labelSlot}>
                <Text
                  numberOfLines={2}
                  onLayout={(event) => {
                    const measuredWidth = Math.ceil(event.nativeEvent.layout.width);
                    setLabelWidths((current) =>
                      current[item.route] === measuredWidth ? current : { ...current, [item.route]: measuredWidth }
                    );
                  }}
                  style={[styles.label, isActive ? styles.labelActive : null]}
                >
                  {formatLabel(item.label)}
                </Text>
                {isActive ? (
                  <View
                    style={[
                      styles.activeUnderline,
                      { width: Math.max(24, Math.min(84, (labelWidths[item.route] ?? 26) + 10)) },
                    ]}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
        {/** search item */}
        {(() => {
          const isActive = searchOpen;
          const iconDimStyle = isActive ? styles.iconActive : styles.iconDimmed;
          return (
        <Pressable onPress={onToggleSearch} style={styles.item}>
          {SHOW_MOBILE_NAV_ICONS ? (
            <View style={styles.iconSlot}>
              <Image source={searchIconSource} style={[styles.customIcon, iconDimStyle]} resizeMode="contain" />
            </View>
          ) : null}
          <View style={styles.labelSlot}>
            <Text
              numberOfLines={2}
              onLayout={(event) => {
                const measuredWidth = Math.ceil(event.nativeEvent.layout.width);
                setLabelWidths((current) =>
                  current.search === measuredWidth ? current : { ...current, search: measuredWidth }
                );
              }}
              style={[styles.label, isActive ? styles.labelActive : null]}
            >
              Search
            </Text>
            {isActive ? (
              <View
                style={[
                  styles.activeUnderline,
                  { width: Math.max(24, Math.min(84, (labelWidths.search ?? 26) + 10)) },
                ]}
              />
            ) : null}
          </View>
        </Pressable>
          );
        })()}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 4,
    position: "relative",
  },
  activeGradientSlot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    paddingHorizontal: 0,
  },
  activeGradientFill: {
    flex: 1,
    borderRadius: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 0,
    position: "relative",
    zIndex: 1,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    paddingBottom: 2,
    minHeight: 54,
    borderRadius: 10,
  },
  iconSlot: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  labelSlot: {
    minHeight: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 1,
    paddingTop: 0,
  },
  activeUnderline: {
    marginTop: 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.panel,
  },
  iconGem: {
    opacity: 1,
    marginBottom: 0,
    transform: [{ translateY: 2 }],
  },
  iconDimmed: {
    opacity: 0.48,
  },
  iconActive: {
    opacity: 0.8,
  },
  customIcon: {
    width: 32,
    height: 32,
    transform: [{ translateY: 1 }],
  },
  customIconLarge: {
    width: 36,
    height: 36,
    transform: [{ translateY: 1 }],
  },
  label: {
    color: colors.background,
    fontFamily: typefaces.display,
    fontSize: 12,
    lineHeight: 12,
    textAlign: "center",
    alignSelf: "center",
  },
  labelActive: {
    color: colors.textLight,
  },
});
