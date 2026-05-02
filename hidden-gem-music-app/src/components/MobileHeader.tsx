import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Country } from "../types/content";
import { SearchOverlay } from "./SearchOverlay";
import { GemIcon } from "./GemIcon";
import { ScreenRoute } from "../types/navigation";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typefaces } from "../theme/typography";

export const navItems: Array<{
  label: string;
  short: string;
  route: ScreenRoute;
  icon: string;
}> = [
  { label: "Discovery Globe", short: "Discover",  route: "discovery",        icon: "🌍" },
  { label: "Comparison Mode", short: "Compare",   route: "comparisonSelect", icon: "⚖️" },
  { label: "Hidden Gems",     short: "Gems",      route: "hiddenGems",       icon: "💎" },
  { label: "Dashboard",       short: "Dashboard", route: "dashboard",        icon: "📊" },
  { label: "Credits",         short: "Credits",   route: "credits",          icon: "✨" },
];

// ─────────────────────────────────────────────────────────────
// Shared prop types
// ─────────────────────────────────────────────────────────────

type TabBarProps = {
  currentRoute: ScreenRoute;
  onNavigate: (route: ScreenRoute) => void;
};

type SharedProps = TabBarProps & {
  searchOpen: boolean;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
  countries: Country[];
  onOpenCountry: (countryId: string) => void;
};

// ─────────────────────────────────────────────────────────────
// MobileTabBar — fixed to bottom of screen
// Render this at your root layout level alongside MobileHeader.
// ─────────────────────────────────────────────────────────────

export function MobileTabBar({
  currentRoute,
  onNavigate,
  searchOpen,
  onToggleSearch,
  onCloseSearch,
  countries,
  onOpenCountry,
}: TabBarProps & Omit<SharedProps, "currentRoute" | "onNavigate">) {
  const insets = useSafeAreaInsets();

  const handleNavigate = (route: ScreenRoute) => {
    onCloseSearch();
    onNavigate(route);
  };

  return (
    <>
      {/* Search overlay rendered above the tab bar */}
      <SearchOverlay
        visible={searchOpen}
        countries={countries}
        onClose={onCloseSearch}
        onOpenCountry={onOpenCountry}
      />

      <LinearGradient
        colors={[colors.navGradient, colors.backgroundSoft]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          tabStyles.tabBar,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        {navItems.map((item) => {
          const isActive = currentRoute === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => handleNavigate(item.route)}
              style={tabStyles.tabItem}
            >
              <View
                style={[
                  tabStyles.tabIconWrap,
                  isActive && tabStyles.tabIconWrapActive,
                ]}
              >
                {item.route === "hiddenGems" ? (
                  <GemIcon size={18} />
                ) : (
                  <Text style={tabStyles.tabIcon}>{item.icon}</Text>
                )}
              </View>
              <Text
                style={[
                  tabStyles.tabLabel,
                  isActive && tabStyles.tabLabelActive,
                ]}
              >
                {item.short}
              </Text>
            </Pressable>
          );
        })}

        {/* Search tab */}
        <Pressable onPress={() => handleNavigate("search")} style={tabStyles.tabItem}>
          <View
            style={[
              tabStyles.tabIconWrap,
              currentRoute === "search" && tabStyles.tabIconWrapActive,
            ]}
          >
            <Text style={tabStyles.searchIcon}>⌕</Text>
          </View>
          <Text
            style={[
              tabStyles.tabLabel,
              currentRoute === "search" && tabStyles.tabLabelActive,
            ]}
          >
            Search
          </Text>
        </Pressable>
      </LinearGradient>
    </>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    zIndex: 20,
  },
  tabItem: {
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tabIconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapActive: {
    backgroundColor: "transparent",
  },
  tabIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  searchIcon: {
    color: colors.border,
    fontSize: 24,
    lineHeight: 24,
  },
  tabLabel: {
    fontFamily: typefaces.body,
    fontSize: 10,
    color: colors.border,
    textAlign: "center",
    opacity: 0.7,
  },
  tabLabelActive: {
    opacity: 1,
    color: "rgba(80,140,200,1)",
  },
});

// ─────────────────────────────────────────────────────────────
// MobileHeader — top bar only (no tab bar inside)
// ─────────────────────────────────────────────────────────────

type HeaderProps = SharedProps;

export function MobileHeader({
  currentRoute,
  onNavigate,
  searchOpen,
  onToggleSearch,
  onCloseSearch,
  countries,
  onOpenCountry,
}: HeaderProps) {
  const handleNavigate = (route: ScreenRoute) => {
    onCloseSearch();
    onNavigate(route);
  };

  return (
    <LinearGradient
      colors={[colors.navGradient, colors.backgroundSoft, colors.backgroundSoft]}
      locations={[0, 0.34, 1]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={headerStyles.wrapper}
    >
      <View style={headerStyles.brandRow}>
        <Pressable onPress={() => handleNavigate("welcome")} style={headerStyles.brandPressable}>
          {/* Brand lockup */}
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const headerStyles = StyleSheet.create({
  wrapper: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
    position: "relative",
    zIndex: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  brandRowCompact: {
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  brandPressable: {
    flexShrink: 0,
  },

  // ── Desktop nav ──────────────────────────────────────────────
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
    marginLeft: "auto",
    flexShrink: 1,
  },
  navCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 40,
    flexWrap: "wrap",
  },
  navLinksTight: {
    gap: 10,
  },
  navItem: {
    paddingVertical: 6,
    paddingBottom: 4,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  navItemTight: {
    minWidth: 138,
  },
  navItemActive: {
    borderBottomColor: colors.accent,
  },
  navItemHover: {
    borderBottomColor: "#BC9DA5",
  },
  navText: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 18,
    fontWeight: "600",
  },
  searchArea: {
    position: "relative",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingBottom: 4,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  searchIcon: {
    color: colors.border,
    fontSize: 24,
    lineHeight: 24,
  },

  // ── Breadcrumbs ──────────────────────────────────────────────
  breadcrumbBar: {
    minHeight: 34,
    justifyContent: "center",
    marginTop: spacing.md,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    backgroundColor: colors.border,
 },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  breadcrumbText: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  breadcrumbLink: {
    textDecorationLine: "none",
  },
  breadcrumbHome: {
    textDecorationLine: "underline",
  },
  breadcrumbCurrent: {
    color: colors.text,
  },
  breadcrumbSeparator: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
});