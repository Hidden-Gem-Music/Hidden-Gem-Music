import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Country } from "../types/content";
import { GemIcon } from "./GemIcon";
import { SearchOverlay } from "./SearchOverlay";
import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typefaces } from "../theme/typography";

const navItems: Array<{ label: string; route: ScreenRoute }> = [
  { label: "Discovery Globe", route: "discovery" },
  { label: "Comparison Mode", route: "comparisonSelect" },
  { label: "Hidden Gems", route: "hiddenGems" },
  { label: "Dashboard", route: "dashboard" },
  { label: "Credits", route: "credits" },
];

type Props = {
  currentRoute: ScreenRoute;
  onNavigate: (route: ScreenRoute) => void;
  breadcrumbs: Array<{ label: string; route: ScreenRoute | null }>;
  searchOpen: boolean;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
  countries: Country[];
  onOpenCountry: (countryId: string) => void;
};

function HiddenWord({ compact }: { compact: boolean }) {
  return (
    <View style={styles.brandWord}>
      <Text style={[styles.brandText, compact ? styles.brandTextCompact : null]}>H</Text>
      <View style={styles.hiddenIWrap}>
        <GemIcon size={14} style={styles.hiddenIGem} />
        <Text style={[styles.brandText, styles.hiddenIText]}>ı</Text>
      </View>
      <Text style={[styles.brandText, compact ? styles.brandTextCompact : null]}>dden</Text>
    </View>
  );
}

function BrandWordmark({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.brandLockup, compact ? styles.brandLockupCompact : null]}>
      <HiddenWord compact={compact} />
      <Text style={[styles.brandText, compact ? styles.brandTextCompact : null]}>Gem</Text>
      <Text style={[styles.brandText, compact ? styles.brandTextCompact : null]}>Music</Text>
    </View>
  );
}

export function AppHeader({
  currentRoute,
  onNavigate,
  breadcrumbs,
  searchOpen,
  onToggleSearch,
  onCloseSearch,
  countries,
  onOpenCountry,
}: Props) {
  const { width } = useWindowDimensions();
  const isCompact = width < 980;
  const isTight = width < 680;
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredRoute, setHoveredRoute] = useState<ScreenRoute | null>(null);
  const [hoveringSearch, setHoveringSearch] = useState(false);

  const handleNavigate = (route: ScreenRoute) => {
    setMenuOpen(false);
    onCloseSearch();
    onNavigate(route);
  };

  const handleToggleSearch = () => {
    setMenuOpen(false);
    onToggleSearch();
  };

  const searchButton = (
    <Pressable
      onPress={handleToggleSearch}
      onHoverIn={() => setHoveringSearch(true)}
      onHoverOut={() => setHoveringSearch(false)}
      style={[
        styles.searchWrap,
        hoveringSearch && !searchOpen ? styles.navItemHover : null,
        searchOpen ? styles.navItemActive : null,
      ]}
    >
      <Text style={styles.navText}>Search</Text>
      <Text style={styles.searchIcon}>⌕</Text>
    </Pressable>
  );

  return (
    <LinearGradient
      colors={[colors.navGradient, colors.backgroundSoft, colors.backgroundSoft]}
      locations={[0, 0.34, 1]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.wrapper}
    >
      <View style={[styles.brandRow, isCompact ? styles.brandRowCompact : null]}>
        <Pressable onPress={() => handleNavigate("welcome")} style={styles.brandPressable}>
          <BrandWordmark compact={isCompact} />
        </Pressable>

        {isCompact ? (
          <View style={styles.mobileMenuWrap}>
            <Pressable onPress={() => setMenuOpen((open) => !open)} style={styles.menuButton}>
              <GemIcon size={20} />
              <Text style={styles.menuButtonText}>Menu</Text>
            </Pressable>

            {menuOpen ? (
              <View style={styles.mobileMenuPanel}>
                {navItems.map((item) => (
                  <Pressable
                    key={item.route}
                    onPress={() => handleNavigate(item.route)}
                    style={[styles.mobileMenuItem, currentRoute === item.route ? styles.mobileMenuItemActive : null]}
                  >
                    <Text style={[styles.mobileMenuText, currentRoute === item.route ? styles.mobileMenuTextActive : null]}>{item.label}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={handleToggleSearch} style={[styles.mobileMenuItem, searchOpen ? styles.mobileMenuItemActive : null]}>
                  <View style={styles.mobileSearchRow}>
                    <Text style={[styles.mobileMenuText, searchOpen ? styles.mobileMenuTextActive : null]}>Search</Text>
                    <Text style={styles.searchIcon}>⌕</Text>
                  </View>
                </Pressable>
              </View>
            ) : null}

            <SearchOverlay visible={searchOpen} countries={countries} onClose={onCloseSearch} onOpenCountry={onOpenCountry} />
          </View>
        ) : (
          <View style={[styles.nav, isTight ? styles.navCompact : null]}>
            <View style={[styles.navLinks, isTight ? styles.navLinksTight : null]}>
              {navItems.map((item) => (
                <Pressable
                  key={item.route}
                  onPress={() => handleNavigate(item.route)}
                  onHoverIn={() => setHoveredRoute(item.route)}
                  onHoverOut={() => setHoveredRoute((current) => (current === item.route ? null : current))}
                  style={[
                    styles.navItem,
                    isTight ? styles.navItemTight : null,
                    hoveredRoute === item.route && currentRoute !== item.route ? styles.navItemHover : null,
                    currentRoute === item.route ? styles.navItemActive : null,
                  ]}
                >
                  <Text style={styles.navText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.searchArea}>
              {searchButton}
              <SearchOverlay visible={searchOpen} countries={countries} onClose={onCloseSearch} onOpenCountry={onOpenCountry} />
            </View>
          </View>
        )}
      </View>
      <View style={styles.breadcrumbBar}>
        <View style={styles.breadcrumbRow}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <View key={`${crumb.label}-${index}`} style={styles.breadcrumbItem}>
                {crumb.route && !isLast ? (
                  <Pressable onPress={() => handleNavigate(crumb.route!)} hitSlop={6}>
                    <Text style={[styles.breadcrumbText, index === 0 ? styles.breadcrumbHome : styles.breadcrumbLink]}>{crumb.label}</Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.breadcrumbText, isLast ? styles.breadcrumbCurrent : null]}>{crumb.label}</Text>
                )}
                {!isLast ? <Text style={styles.breadcrumbSeparator}> / </Text> : null}
              </View>
            );
          })}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: spacing.lg,
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
  brandLockup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },
  brandLockupCompact: {
    gap: 8,
  },
  brandWord: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  brandText: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 42,
    fontWeight: "600",
    letterSpacing: -2,
  },
  brandTextCompact: {
    fontSize: 34,
  },
  hiddenIWrap: {
    width: 14,
    height: 46,
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
    marginRight: 1,
  },
  hiddenIGem: {
    position: "absolute",
    top: -3,
    right: -7,
  },
  hiddenIText: {
    lineHeight: 42,
    transform: [{ translateY: -4 }],
  },
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
  mobileMenuWrap: {
    marginLeft: "auto",
    minWidth: 150,
    position: "relative",
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minWidth: 150,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.button,
    borderWidth: 4,
    borderColor: colors.border,
    borderRadius: 18,
  },
  menuButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "800",
  },
  mobileMenuPanel: {
    marginTop: 10,
    padding: 10,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    gap: 8,
  },
  mobileMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  mobileMenuItemActive: {
    backgroundColor: "rgba(117,82,107,0.18)",
  },
  mobileMenuText: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 18,
    fontWeight: "600",
  },
  mobileMenuTextActive: {
    color: colors.border,
  },
  mobileSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
});
