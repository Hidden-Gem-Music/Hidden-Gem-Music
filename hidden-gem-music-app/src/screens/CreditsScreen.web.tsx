import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

const creditSections = [
  "Leena Komenski - Insert Role, Role.",
  "mp3li - Insert role, insert role",
  "Landin Mohr - Role",
] as const;

const memberLinkSections = ["Leena Komenski", "mp3li", "Landin Mohr"] as const;

function CreditsSurface({
  children,
  style,
  fillVariant = "comparisonBlue",
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  fillVariant?: "comparisonBlue" | "softBlue";
}) {
  return (
    <Panel style={[styles.surfacePanel, style]}>
      {fillVariant === "softBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#5D6983", colors.backgroundBottom]}
          locations={[0, 0.48, 0.82, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.surfaceFill}
        />
      ) : (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#70536A"]}
          locations={[0, 0.38, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.surfaceFill}
        />
      )}
      <View style={styles.surfaceContent}>{children}</View>
    </Panel>
  );
}

function CreditBulletList() {
  return (
    <View style={styles.bulletList}>
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={index} style={styles.bulletRow}>
          <GemIcon size={14} />
          <Text style={styles.bulletText}>Insert name of thing this person did</Text>
        </View>
      ))}
    </View>
  );
}

function CreditsPageContent() {
  const pageScrollRef = useRef<ScrollView>(null);
  const pageTrackRef = useRef<View>(null);
  const [pageViewportHeight, setPageViewportHeight] = useState(0);
  const [pageContentHeight, setPageContentHeight] = useState(0);
  const [pageScrollY, setPageScrollY] = useState(0);
  const [isDraggingPageScrollbar, setIsDraggingPageScrollbar] = useState(false);
  const pageScrollbarVisible = Platform.OS === "web" && pageViewportHeight > 0;
  const pageHasOverflow = pageScrollbarVisible && pageContentHeight > pageViewportHeight;
  const pageTrackHeight = Math.max(pageViewportHeight - 24, 1);
  const pageThumbHeight = pageScrollbarVisible
    ? pageHasOverflow
      ? Math.max((pageViewportHeight / pageContentHeight) * pageViewportHeight, 60)
      : pageTrackHeight
    : 0;
  const pageThumbTop = pageHasOverflow ? (pageScrollY / (pageContentHeight - pageViewportHeight)) * (pageViewportHeight - pageThumbHeight) : 0;

  const handlePageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPageScrollY(event.nativeEvent.contentOffset.y);
  };

  const scrollPageToTrackLocation = (locationY: number) => {
    if (!pageHasOverflow || pageContentHeight <= pageViewportHeight) {
      return;
    }

    const nextThumbTop = Math.min(Math.max(locationY - pageThumbHeight / 2, 0), pageTrackHeight - pageThumbHeight);
    const nextRatio = nextThumbTop / (pageTrackHeight - pageThumbHeight);
    const nextScrollY = nextRatio * (pageContentHeight - pageViewportHeight);
    pageScrollRef.current?.scrollTo({ y: nextScrollY, animated: false });
    setPageScrollY(nextScrollY);
  };

  const scrollPageToClientY = (clientY: number) => {
    const rect = (pageTrackRef.current as any)?.getBoundingClientRect?.();
    if (!rect) {
      return;
    }

    scrollPageToTrackLocation(clientY - rect.top);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || !isDraggingPageScrollbar || typeof document === "undefined") {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;

    const handleMove = (event: MouseEvent) => {
      event.preventDefault();
      scrollPageToClientY(event.clientY);
    };

    const handleUp = () => {
      setIsDraggingPageScrollbar(false);
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingPageScrollbar, pageHasOverflow, pageThumbHeight, pageTrackHeight, pageContentHeight, pageViewportHeight]);

  return (
    <ScreenScaffold>
      <View style={styles.pageScrollFrame}>
        <ScrollView
          ref={pageScrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => setPageViewportHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => setPageContentHeight(height)}
          onScroll={handlePageScroll}
          scrollEventThrottle={16}
        >
          <DiscoveryBlurb
            heading="Hidden Gem Music Credits"
            body="this is the text inside the blurb that will say things about the page you're on and will guide users through the experience. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
          />

          <CreditsSurface style={styles.creditsSummaryPanel}>
            <View style={styles.creditCardsColumn}>
              {creditSections.map((title) => (
                <View key={title} style={styles.creditCard}>
                  <View style={styles.creditCardTitleWrap}>
                    <Text style={styles.creditCardTitle}>{title}</Text>
                    <View style={styles.creditCardUnderline} />
                  </View>
                  <Text style={styles.creditBodyCopy}>
                    Here is a short info section of all yadayada done by this team member:
                  </Text>
                  <CreditBulletList />
                </View>
              ))}
            </View>
          </CreditsSurface>

          <CreditsSurface style={styles.emptyLowerPanel} fillVariant="softBlue">
            <View style={styles.memberLinksRow}>
              {memberLinkSections.map((name) => (
                <View key={name} style={styles.memberLinkCard}>
                  <View style={styles.memberLinkTitleWrap}>
                    <Text style={styles.memberLinkHeader}>{name}</Text>
                    <View style={styles.memberLinkUnderline} />
                  </View>
                  <Text style={styles.memberLinkBody}>
                    This area is for links to more of this team member&apos;s work and socials.
                  </Text>
                </View>
              ))}
            </View>
          </CreditsSurface>
        </ScrollView>

        {pageScrollbarVisible ? (
          <View
            ref={pageTrackRef}
            style={styles.pageScrollbarTrack}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => scrollPageToTrackLocation(event.nativeEvent.locationY)}
            onResponderMove={(event) => scrollPageToTrackLocation(event.nativeEvent.locationY)}
            {...(Platform.OS === "web"
              ? ({
                  onMouseDown: (event: any) => {
                    event.preventDefault();
                    setIsDraggingPageScrollbar(true);
                    scrollPageToClientY(event.clientY);
                  },
                } as any)
              : {})}
          >
            <View style={[styles.pageScrollbarThumb, { height: pageThumbHeight, transform: [{ translateY: pageThumbTop }] }]} />
          </View>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export function CreditsScreen() {
  return <CreditsPageContent />;
}

const styles = StyleSheet.create({
  pageScrollFrame: {
    flex: 1,
    position: "relative",
    marginTop: -4,
    marginBottom: -20,
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
          scrollbarWidth: "none",
        } as ViewStyle)
      : null),
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 24,
    paddingRight: 18,
  },
  pageScrollbarTrack: {
    position: "absolute",
    top: 12,
    right: 2,
    bottom: 12,
    width: 14,
    borderRadius: 999,
    backgroundColor: colors.scrollbarTrack,
    cursor: "pointer" as any,
  },
  pageScrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.scrollbarThumb,
  },
  surfacePanel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  surfaceFill: {
    ...StyleSheet.absoluteFillObject,
  },
  surfaceContent: {
    padding: 18,
    gap: 16,
  },
  creditsSummaryPanel: {
    minHeight: 760,
  },
  creditCardsColumn: {
    gap: 16,
  },
  creditCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.12)",
    padding: 16,
    gap: 12,
  },
  creditCardTitleWrap: {
    gap: 4,
    alignSelf: "flex-start",
  },
  creditCardTitle: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  creditCardUnderline: {
    width: "100%",
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.92,
  },
  creditBodyCopy: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletText: {
    flex: 1,
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyLowerPanel: {
    minHeight: 220,
    borderWidth: 2,
    borderColor: "rgba(117, 82, 107, 0.42)",
  },
  memberLinksRow: {
    minHeight: 220,
    flexDirection: "row",
    gap: 14,
    alignItems: "stretch",
  },
  memberLinkCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.12)",
    padding: 16,
    gap: 10,
  },
  memberLinkTitleWrap: {
    gap: 4,
    alignSelf: "flex-start",
  },
  memberLinkHeader: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  memberLinkUnderline: {
    width: "100%",
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.92,
  },
  memberLinkBody: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
