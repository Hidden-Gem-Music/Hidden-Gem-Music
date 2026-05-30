import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Country } from "../types/content";
import { useMobileExperience } from "../config/discoveryMode";
import { GemIcon } from "./GemIcon";
import { SearchOverlay } from "./SearchOverlay";
import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typefaces } from "../theme/typography";

const navItems: Array<{ label: string; route: ScreenRoute }> = [
  { label: "Discovery Map", route: "discovery" },
  { label: "Discovery Dashboard", route: "dashboard" },
  { label: "Comparison Mode", route: "comparisonSelect" },
  { label: "Hidden Gems", route: "hiddenGems" },
  { label: "Credits", route: "credits" },
];

type BrandVariant = "webLarge" | "webSmall" | "mobile";

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

function HiddenWord({ variant }: { variant: BrandVariant }) {
  const isMobile = variant === "mobile";
  const isWebSmall = variant === "webSmall";

  return (
    <View style={styles.brandWord}>
      <View style={isMobile ? styles.hiddenHWrapMobile : null}>
        <Text
          style={[
            styles.brandText,
            isWebSmall ? styles.brandTextWebSmall : null,
            isMobile ? styles.brandTextMobile : null,
            isMobile ? styles.hiddenHTextMobile : null,
          ]}
        >
          H
        </Text>
      </View>
      <View
        style={[
          styles.hiddenIWrap,
          isWebSmall ? styles.hiddenIWrapWebSmall : null,
          isMobile ? styles.hiddenIWrapMobile : null,
        ]}
      >
        <GemIcon
          size={isMobile ? 12 : isWebSmall ? 13 : 14}
          style={[
            styles.hiddenIGem,
            isWebSmall ? styles.hiddenIGemWebSmall : null,
            isMobile ? styles.hiddenIGemMobile : null,
          ]}
        />
        <Text
          style={[
            styles.brandText,
            styles.hiddenIText,
            isWebSmall ? styles.brandTextWebSmall : null,
            isWebSmall ? styles.hiddenITextWebSmall : null,
            isMobile ? styles.brandTextMobile : null,
            isMobile ? styles.hiddenITextMobile : null,
          ]}
        >
          ı
        </Text>
      </View>
      <Text
        style={[
          styles.brandText,
          isWebSmall ? styles.brandTextWebSmall : null,
          isMobile ? styles.brandTextMobile : null,
        ]}
      >
        dden
      </Text>
    </View>
  );
}

function BrandWordmark({ variant }: { variant: BrandVariant }) {
  const isMobile = variant === "mobile";
  const isWebSmall = variant === "webSmall";

  return (
    <View
      style={[
        styles.brandLockup,
        isWebSmall ? styles.brandLockupWebSmall : null,
        isMobile ? styles.brandLockupMobile : null,
      ]}
    >
      <HiddenWord variant={variant} />
      <Text
        style={[
          styles.brandText,
          isWebSmall ? styles.brandTextWebSmall : null,
          isMobile ? styles.brandTextMobile : null,
        ]}
      >
        Gem
      </Text>
      <Text
        style={[
          styles.brandText,
          isWebSmall ? styles.brandTextWebSmall : null,
          isMobile ? styles.brandTextMobile : null,
        ]}
      >
        Music
      </Text>
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
  const isMobileExperience = useMobileExperience();
  const isCompact = isMobileExperience || width < 980;
  const isTight = width < 680;
  const brandVariant: BrandVariant = isMobileExperience ? "mobile" : width < 1280 ? "webSmall" : "webLarge";
  const [hoveredRoute, setHoveredRoute] = useState<ScreenRoute | null>(null);
  const [hoveringSearch, setHoveringSearch] = useState(false);
  const [pressedBreadcrumbIndex, setPressedBreadcrumbIndex] = useState<number | null>(null);
  const activeBreadcrumbIndex = useMemo(() => Math.max(breadcrumbs.length - 1, 0), [breadcrumbs.length]);
  const isNavItemActive = (route: ScreenRoute) =>
    currentRoute === route ||
    (route === "comparisonSelect" && currentRoute === "comparisonResults") ||
    (route === "discovery" && currentRoute === "country");

  useEffect(() => {
    setPressedBreadcrumbIndex(null);
  }, [currentRoute]);

  const handleNavigate = (route: ScreenRoute) => {
    onCloseSearch();
    onNavigate(route);
  };

  const handleToggleSearch = () => {
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
      <View
        style={[
          styles.brandRow,
          brandVariant === "webSmall" ? styles.brandRowWebSmall : null,
          isCompact ? styles.brandRowCompact : null,
        ]}
      >
        <Pressable
          onPress={() => handleNavigate("welcome")}
          style={[styles.brandPressable, brandVariant === "mobile" ? styles.brandPressableMobile : null]}
        >
          <BrandWordmark variant={brandVariant} />
        </Pressable>

        {isCompact ? (
          <View style={styles.mobileMenuWrap} />
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
                    hoveredRoute === item.route && !isNavItemActive(item.route) ? styles.navItemHover : null,
                    isNavItemActive(item.route) ? styles.navItemActive : null,
                  ]}
                >
                  <Text style={styles.navText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.searchArea}>
              {searchButton}
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
                  <Pressable
                    onPress={() => handleNavigate(crumb.route!)}
                    onPressIn={() => setPressedBreadcrumbIndex(index)}
                    onPressOut={() => setPressedBreadcrumbIndex((current) => (current === index ? null : current))}
                    hitSlop={6}
                  >
                    <Text
                      style={[
                        styles.breadcrumbText,
                        index === activeBreadcrumbIndex ? styles.breadcrumbActive : styles.breadcrumbLink,
                        pressedBreadcrumbIndex === index ? styles.breadcrumbPressed : null,
                      ]}
                    >
                      {crumb.label}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.breadcrumbText, isLast ? styles.breadcrumbActive : null]}>{crumb.label}</Text>
                )}
                {!isLast ? <Text style={styles.breadcrumbSeparator}> / </Text> : null}
              </View>
            );
          })}
        </View>
      </View>
      <SearchOverlay visible={searchOpen} countries={countries} onClose={onCloseSearch} onOpenCountry={onOpenCountry} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: spacing.xl + 4,
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
    position: "relative",
    zIndex: 500,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 8,
  },
  brandRowWebSmall: {
    marginTop: 12,
  },
  brandRowCompact: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 18,
  },
  brandPressable: {
    flexShrink: 0,
    overflow: "visible",
  },
  brandPressableMobile: {
    paddingTop: 6,
    paddingRight: 30,
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    flexWrap: "wrap",
    paddingRight: 6,
    overflow: "visible",
  },
  brandLockupWebSmall: {
    gap: 8,
  },
  brandLockupMobile: {
    gap: 5,
    paddingRight: 28,
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
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  brandTextWebSmall: {
    fontSize: 36,
    lineHeight: 42,
  },
  brandTextMobile: {
    fontSize: 34,
    lineHeight: 40,
    paddingRight: 0,
  },
  hiddenIWrap: {
    width: 15,
    height: 50,
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
    marginRight: 0,
  },
  hiddenIWrapWebSmall: {
    width: 13,
    height: 42,
  },
  hiddenIWrapMobile: {
    width: 12,
    height: 40,
    marginRight: 0,
    zIndex: 1,
  },
  hiddenIGem: {
    position: "absolute",
    top: 0,
    right: -6,
  },
  hiddenIGemWebSmall: {
    top: 0,
    right: -5,
  },
  hiddenIGemMobile: {
    top: 5,
    right: -4,
  },
  hiddenIText: {
    lineHeight: 44,
    transform: [{ translateY: -4 }],
  },
  hiddenITextWebSmall: {
    lineHeight: 36,
    transform: [{ translateY: -3 }],
  },
  hiddenITextMobile: {
    fontSize: 29,
    lineHeight: 34,
    transform: [{ translateY: -1 }],
  },
  hiddenHWrapMobile: {
    position: "relative",
    zIndex: 6,
    overflow: "visible",
  },
  hiddenHTextMobile: {
    position: "relative",
    zIndex: 6,
    paddingRight: 3,
    marginRight: -3,
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
    zIndex: 0,
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
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  breadcrumbLink: {
    textDecorationLine: "none",
  },
  breadcrumbActive: {
    textDecorationLine: "underline",
  },
  breadcrumbPressed: {
    color: colors.accent,
  },
  breadcrumbSeparator: {
    color: colors.textLight,
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
    zIndex: 400,
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
    minWidth: 1,
  },
});
