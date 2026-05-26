import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { useMobileExperience } from "../config/discoveryMode";
import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

const mobileNavItems: Array<{ label: string; route: ScreenRoute }> = [
  { label: "Discovery Map", route: "discovery" },
  { label: "Discovery Dashboard", route: "dashboard" },
  { label: "Compare", route: "comparisonSelect" },
  { label: "Hidden Gems", route: "hiddenGems" },
  { label: "Credits", route: "credits" },
];
const mobileSearchItem = { label: "Search", route: "search" as const };

type Props = {
  currentRoute: ScreenRoute;
  searchOpen: boolean;
  onNavigate: (route: ScreenRoute) => void;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
};

export function MobileBottomNav({ currentRoute, searchOpen, onNavigate, onToggleSearch, onCloseSearch }: Props) {
  const { width } = useWindowDimensions();
  const isMobileExperience = useMobileExperience();
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});
  const isSearchActive = searchOpen;
  const isRouteActive = (route: ScreenRoute) =>
    currentRoute === route ||
    (route === "comparisonSelect" && currentRoute === "comparisonResults") ||
    (route === "discovery" && currentRoute === "country");
  if (!isMobileExperience && width >= 980) {
    return null;
  }

  const allItems = [...mobileNavItems, mobileSearchItem];
  const itemCount = allItems.length;
  const activeIndex = searchOpen
    ? itemCount - 1
    : Math.max(
        0,
        allItems.findIndex((item) => isRouteActive(item.route))
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
      : ([
          "rgba(117,82,107,0)",
          "rgba(117,82,107,0.58)",
          "rgba(117,82,107,0.82)",
          "rgba(117,82,107,0.58)",
          "rgba(117,82,107,0)",
        ] as const);
  const edgeGradientLocations = isLeftEdge || isRightEdge ? ([0, 0.5, 1] as const) : ([0, 0.3, 0.5, 0.7, 1] as const);
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
          const isActive = !searchOpen && isRouteActive(item.route);
          return (
            <Pressable
              key={item.route}
              onPress={() => {
                onCloseSearch();
                onNavigate(item.route);
              }}
              style={styles.item}
            >
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
        <Pressable onPress={onToggleSearch} style={styles.item}>
          <View style={styles.labelSlot}>
            <Text
              numberOfLines={2}
              onLayout={(event) => {
                const measuredWidth = Math.ceil(event.nativeEvent.layout.width);
                setLabelWidths((current) =>
                  current.search === measuredWidth ? current : { ...current, search: measuredWidth }
                );
              }}
              style={[styles.label, isSearchActive ? styles.labelActive : null]}
            >
              Search
            </Text>
            {isSearchActive ? (
              <View
                style={[
                  styles.activeUnderline,
                  { width: Math.max(24, Math.min(84, (labelWidths.search ?? 26) + 10)) },
                ]}
              />
            ) : null}
          </View>
        </Pressable>
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
    zIndex: 700,
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
  label: {
    color: colors.background,
    fontFamily: typefaces.display,
    fontSize: 13,
    lineHeight: 13,
    textAlign: "center",
    alignSelf: "center",
  },
  labelActive: {
    color: colors.textLight,
  },
});
