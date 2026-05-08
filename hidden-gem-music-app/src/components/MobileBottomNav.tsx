import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

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

type Props = {
  currentRoute: ScreenRoute;
  searchOpen: boolean;
  onNavigate: (route: ScreenRoute) => void;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
};

export function MobileBottomNav({ currentRoute, searchOpen, onNavigate, onToggleSearch, onCloseSearch }: Props) {
  const { width } = useWindowDimensions();
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
          return (
            <Pressable
              key={item.route}
              onPress={() => {
                onCloseSearch();
                onNavigate(item.route);
              }}
              style={styles.item}
            >
              <View style={styles.iconSlot}>
                <GemIcon size={24} style={styles.iconGem} />
              </View>
              <View style={styles.labelSlot}>
                <Text style={[styles.label, isActive ? styles.labelActive : null]}>{item.label}</Text>
              </View>
            </Pressable>
          );
        })}
        {/** search item */}
        {(() => {
          const isActive = searchOpen;
          return (
        <Pressable onPress={onToggleSearch} style={styles.item}>
          <View style={styles.iconSlot}>
            <GemIcon size={24} style={styles.iconGem} />
          </View>
          <View style={styles.labelSlot}>
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>Search</Text>
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
    justifyContent: "flex-start",
    paddingTop: 2,
    paddingBottom: 2,
    minHeight: 54,
    borderRadius: 10,
  },
  iconSlot: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  labelSlot: {
    minHeight: 24,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 1,
    paddingTop: 2,
  },
  iconGem: {
    opacity: 1,
    marginBottom: 0,
    transform: [{ translateY: 1 }],
  },
  label: {
    color: colors.background,
    fontFamily: typefaces.display,
    fontSize: 12,
    lineHeight: 13,
    textAlign: "center",
  },
  labelActive: {
    color: colors.textLight,
  },
});
