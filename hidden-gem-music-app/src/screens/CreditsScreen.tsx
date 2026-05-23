import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
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

type CreditSection = {
  name: string;
  role: string;
  summary: string;
  bullets: string[];
  isPending?: boolean;
};

type MemberLinkSection = {
  name: string;
  body: string;
  links?: Array<{
    label: string;
    url: string;
  }>;
};

type DataSourceSection = {
  title: string;
  summary: string;
  bullets: string[];
  links: Array<{
    label: string;
    url: string;
  }>;
};

const creditSections: CreditSection[] = [
  {
    name: "Leena Komenski",
    role: "Team Lead, Data Engineering, Backend Architecture, and Data Visualization",
    summary:
      "Built the foundation Hidden Gem Music runs on. Every insight, every chart, every discovery the app surfaces exists because of the data pipeline, stored procedures, and backend architecture underneath it.",
    bullets: [
      "Co-named the Discovery Gap and defined how to quantify it — translating the concept into the metrics, stored procedures, and data structures that make it visible across the app.",
      "Sourced, cleaned, and ingested 28.2 million rows of Spotify chart data spanning 73 countries and eight years into a SQL Server database built from scratch — including diagnosing and resolving a SQL Server 2025 compatibility break that prevented standard CSV ingestion entirely.",
      "Migrated the database mid-project from a transactional structure to a star-schema data warehouse — redesigning the schema, moving all data without loss, and rebuilding the stored procedure suite against the new structure.",
      "Designed and implemented the index strategy and pre-computation architecture that makes the app fast — including all summary tables populated once and read instantly at runtime.",
      "Authored the full SQL stored procedure suite powering every data insight in the app, and maintained sole ownership of database health throughout the project.",
      "Ran multiple systematic data quality investigations across the pipeline — diagnosing structural and correctness flaws end-to-end, from aggregation errors and schema mismatches to wrong data surfacing in live screens.",
      "Resolved each investigation end-to-end: live schema changes, stored procedure rewrites, and full summary-table repopulation in dependency order — often tracing root cause from a frontend symptom all the way back to the query layer.",
      "Optimized backend performance through pre-computed summary tables, backend parallelization, and frontend API caching — turning multi-second loads into near-instant responses.",
      "Scaffolded the complete .NET 9 backend — controllers, repository interfaces, data models, and DTOs — giving mp3li the foundation to build the app's feature endpoints on top of.",
      "Created the Discovery Dashboard — translating 28.2 million rows of raw chart data into an interactive, readable analytics view that makes the app's central argument visible to anyone who uses it, through four live charts, four KPI cards, and a dynamic discovery gap display.",
      "Managed the project end-to-end: proposal, timeline, GitHub board, PR reviews, and scope decisions throughout.",
    ],
  },
  {
    name: "mp3li",
    role: "Frontend Lead, UX Implementation, Additional Data Integration, and Presentation Tooling",
    summary:
      "Owned the app-facing design and implementation work that turned Hidden Gem Music into a polished, data-connected web and mobile experience. This included visual design, screen flow, user experience direction, frontend architecture, screen builds, interaction systems, Deezer-backed additional-data integration, Deezer metadata workflows, album-art and preview-data handling, loading behavior, documentation, QA, and presentation-readiness support. The Discovery Dashboard was originally created by Leena; mp3li's Dashboard work focused on frontend polish, naming/navigation updates, and the native/mobile adaptation without Recharts.",
    bullets: [
      "Designed the app's visual direction, screen flow, interaction model, and overall user experience across the full Hidden Gem Music interface.",
      "Established the frontend architecture and core screen scaffolding, including the shared app shell, screen ownership patterns, navigation structure, visual system, and responsive layout direction.",
      "Built and maintained the React Native / React Native Web app shell, including routing, breadcrumbs, selected year/country state, Welcome behavior, search flow, and mobile bottom navigation.",
      "Implemented and integrated the main user-facing screens across web and mobile, including Discovery Map, Country Detail, Comparison Mode, Comparison View, Hidden Gems, and Credits.",
      "Adapted Leena's Discovery Dashboard for native/mobile use by matching the narrow web layout closely and replacing Recharts with custom React Native chart components, tap-selected value states, and mobile-safe card and loading behavior.",
      "Implemented the app-owned interactive Discovery Map experience, including custom world-map rendering, country selection, hover/tap behavior, list/map synchronization, filters, zoom/reset controls, and responsive map behavior.",
      "Built and refined Hidden Gems UI behavior, including song preview playback, paginated song lists, CD art handling, favorite-artist display, selected-song focus handoff, loading states, and metadata presentation.",
      "Connected frontend screens to live backend data flows, including API client layers, mapper compatibility work, paged country song lists, comparison results, hidden-gem previews, and metadata-backed year handling.",
      "Verified and hardened backend integration points where needed, including country/comparison endpoint validation, restored-database diagnostics, stored-procedure contract checks, SQL handoff notes, and local API smoke testing.",
      "Integrated additional song data across the app, including Deezer-backed album art and metadata, explicit-content details, contributor/record information, Genius lyrics URLs, language display, and graceful missing-data handling.",
      "Created and maintained mp3li Additional Data Getter v2 workflows for organized additional-data collection, Genius URL validation, lyrics/language preparation, synchronized outputs, and app-facing language data support.",
      "Added presentation data prep tooling and cache-aware loading support for Discovery samples, country/comparison summary sections, and Hidden Gems demo paths while preserving fallback behavior.",
      "Managed practical project workflow support, including branch movement, merge cleanup, local-only file hygiene, database restore verification, issue planning, PR preparation, and teammate handoff documentation.",
      "Completed frontend polish and stabilization work across loading states, mobile responsiveness, route behavior, data fallbacks, copy wording, scrollbar behavior, and visual consistency.",
      "Produced and maintained frontend documentation, QA logs, PR drafts, implementation timelines, issue handoff notes, and project workflow documentation.",
      "Performed repeated browser and mobile testing, regression triage, UI polish, loading optimization, branch cleanup, and presentation-readiness verification across the frontend app.",
    ],
  },
];

const memberLinkSections: MemberLinkSection[] = [
  {
    name: "Leena Komenski",
    body: "Follow Leena Komenski's work and connect with them here:",
    links: [
      { label: "GitHub", url: "https://github.com/lkomenski" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/leena-komenski" },
    ],
  },
  {
    name: "mp3li",
    body: "Follow mp3li's work and connect with them here:",
    links: [
      { label: "Linktree", url: "https://linktr.ee/mp3li" },
      { label: "Patreon", url: "https://www.patreon.com/mp3li" },
      { label: "GitHub", url: "https://github.com/mp3li" },
      { label: "TikTok", url: "https://www.tiktok.com/@mp3li.videos" },
      { label: "Reddit", url: "https://www.reddit.com/u/jasperhooloop/s/qkgd8zrz4W" },
    ],
  },
] as const;

const dataSourceSection: DataSourceSection = {
  title: "Data Sources & Music APIs",
  summary:
    "Hidden Gem Music combines large-scale Spotify chart datasets with live music metadata APIs to power its discovery, comparison, country, hidden-gem, and presentation views.",
  bullets: [
    "Spotify chart history from Kaggle supports the app's historical country/year song analysis, including country profiles, comparison views, shared-song counts, and hidden-gem calculations.",
    "The daily Top Spotify Songs in 73 Countries dataset supports the newer country chart coverage used throughout the app's current-year discovery and dashboard experiences.",
    "Deezer API metadata is used for app-facing song details such as album art, preview/audio metadata, artist and album information, explicit-content fields, contributors, and tracklist-backed display details.",
  ],
  links: [
    {
      label: "Top Spotify Songs in 73 Countries",
      url: "https://www.kaggle.com/datasets/asaniczka/top-spotify-songs-in-73-countries-daily-updated",
    },
    {
      label: "Spotify Charts",
      url: "https://www.kaggle.com/datasets/dhruvildave/spotify-charts",
    },
    {
      label: "Deezer API",
      url: "https://developers.deezer.com/api",
    },
  ],
};

function CreditsSurface({
  children,
  style,
  fillVariant = "comparisonBlue",
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  fillVariant?: "comparisonBlue" | "softBlue" | "blurb";
}) {
  return (
    <Panel style={[styles.surfacePanel, style]}>
      {fillVariant === "blurb" ? (
        <LinearGradient
          colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.42)", "rgba(66,72,101,0.72)"]}
          locations={[0, 0.42, 0.78, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.surfaceFill}
        />
      ) : fillVariant === "softBlue" ? (
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

function DataSourceLinkButton({ label, url }: { label: string; url: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      style={[
        styles.dataSourceLinkRow,
        isHovered ? styles.dataSourceLinkRowHovered : null,
        isPressed ? styles.dataSourceLinkRowPressed : null,
      ]}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => Linking.openURL(url)}
    >
      <LinearGradient
        colors={
          isPressed
            ? ["rgba(15,16,21,0.52)", "rgba(35,38,55,0.42)", "rgba(66,72,101,0.24)"]
            : isHovered
              ? ["rgba(117,82,107,0.42)", "rgba(66,72,101,0.42)", "rgba(44,46,75,0.34)"]
              : ["rgba(169,176,209,0.12)", "rgba(66,72,101,0.22)", "rgba(35,38,55,0.26)"]
        }
        locations={[0, 0.56, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.memberLinkRowFill}
      />
      <Text style={styles.dataSourceLinkLabel}>{label}</Text>
      <Text style={styles.dataSourceLinkUrl}>{url}</Text>
    </Pressable>
  );
}

function CreditBulletList({ bullets }: { bullets: string[] }) {
  if (bullets.length === 0) {
    return null;
  }

  return (
    <View style={styles.bulletList}>
      {bullets.map((bullet) => (
        <View key={bullet} style={styles.bulletRow}>
          <GemIcon size={14} />
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  );
}

function MemberLinkButton({ label, url }: { label: string; url: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      style={[
        styles.memberLinkRow,
        isHovered ? styles.memberLinkRowHovered : null,
        isPressed ? styles.memberLinkRowPressed : null,
      ]}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => Linking.openURL(url)}
    >
      <LinearGradient
        colors={
          isPressed
            ? ["rgba(22,26,38,0.46)", "rgba(22,26,38,0.3)", "rgba(22,26,38,0.2)"]
            : isHovered
              ? ["rgba(117,82,107,0.48)", "rgba(108,119,142,0.4)", "rgba(108,119,142,0.32)"]
              : ["rgba(117,82,107,0.24)", "rgba(108,119,142,0.2)", "rgba(108,119,142,0.16)"]
        }
        locations={[0, 0.58, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.memberLinkRowFill}
      />
      <Text style={[styles.memberLinkLabel, isHovered || isPressed ? styles.memberLinkTextActive : null]}>{label}</Text>
      <Text style={[styles.memberLinkUrl, isHovered || isPressed ? styles.memberLinkTextActive : null]}>{url}</Text>
    </Pressable>
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
            body="This page recognizes the people who built Hidden Gem Music and summarizes the major work behind the app, data workflows, interface design, testing, and project documentation."
          />

          <CreditsSurface style={styles.creditsSummaryPanel}>
            <View style={styles.creditCardsColumn}>
              {creditSections.map((section) => (
                <View key={section.name} style={styles.creditCard}>
                  <View style={styles.creditCardTitleWrap}>
                    <Text style={styles.creditCardTitle}>{`${section.name} - ${section.role}`}</Text>
                    <View style={styles.creditCardUnderline} />
                  </View>
                  <Text style={[styles.creditBodyCopy, section.isPending ? styles.creditBodyPending : null]}>
                    {section.summary}
                  </Text>
                  <CreditBulletList bullets={section.bullets} />
                </View>
              ))}
            </View>
          </CreditsSurface>

          <CreditsSurface style={styles.emptyLowerPanel} fillVariant="softBlue">
            <View style={styles.memberLinksRow}>
              {memberLinkSections.map((section) => (
                <View key={section.name} style={styles.memberLinkCard}>
                  <View style={styles.memberLinkTitleWrap}>
                    <Text style={styles.memberLinkHeader}>{section.name}</Text>
                    <View style={styles.memberLinkUnderline} />
                  </View>
                  <Text style={styles.memberLinkBody}>
                    {section.body}
                  </Text>
                  {section.links ? (
                    <View style={styles.memberLinkList}>
                      {section.links.map((link) => (
                        <MemberLinkButton key={link.url} label={link.label} url={link.url} />
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </CreditsSurface>

          <CreditsSurface style={styles.dataSourcesPanel} fillVariant="blurb">
            <View style={styles.dataSourceCard}>
              <View style={styles.creditCardTitleWrap}>
                <Text style={styles.dataSourceTitle}>{dataSourceSection.title}</Text>
                <View style={styles.dataSourceUnderline} />
              </View>
              <Text style={styles.dataSourceBody}>{dataSourceSection.summary}</Text>
              <View style={styles.bulletList}>
                {dataSourceSection.bullets.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <GemIcon size={14} />
                    <Text style={styles.dataSourceBulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.dataSourceLinkGrid}>
                {dataSourceSection.links.map((link) => (
                  <DataSourceLinkButton key={link.url} label={link.label} url={link.url} />
                ))}
              </View>
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
    minHeight: 0,
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
    fontSize: 25,
    lineHeight: 30,
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
    fontSize: 17,
    lineHeight: 26,
  },
  creditBodyPending: {
    opacity: 0.82,
    fontStyle: "italic",
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
    fontSize: 16,
    lineHeight: 24,
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
    fontSize: 25,
    lineHeight: 30,
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
    fontSize: 16,
    lineHeight: 24,
  },
  memberLinkList: {
    gap: 8,
    marginTop: 4,
  },
  memberLinkRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(117,82,107,0.72)",
    backgroundColor: "rgba(22,26,38,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 2,
    overflow: "hidden",
  },
  memberLinkRowFill: {
    ...StyleSheet.absoluteFillObject,
  },
  memberLinkRowHovered: {
    borderColor: "rgba(117,82,107,0.95)",
  },
  memberLinkRowPressed: {
    borderColor: colors.accent,
    transform: [{ scale: 0.99 }],
  },
  memberLinkLabel: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  memberLinkUrl: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.78,
  },
  memberLinkTextActive: {
    opacity: 1,
  },
  dataSourcesPanel: {
    minHeight: 0,
    borderWidth: 2,
    borderColor: "rgba(169,176,209,0.28)",
  },
  dataSourceCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(169,176,209,0.42)",
    backgroundColor: "rgba(22,26,38,0.2)",
    padding: 16,
    gap: 12,
  },
  dataSourceTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 25,
    lineHeight: 30,
  },
  dataSourceUnderline: {
    width: "100%",
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.textLight,
    opacity: 0.72,
  },
  dataSourceBody: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 17,
    lineHeight: 26,
  },
  dataSourceBulletText: {
    flex: 1,
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 24,
  },
  dataSourceLinkGrid: {
    gap: 8,
    marginTop: 4,
  },
  dataSourceLinkRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(169,176,209,0.36)",
    backgroundColor: "rgba(22,26,38,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 2,
    overflow: "hidden",
  },
  dataSourceLinkRowHovered: {
    borderColor: "rgba(169,176,209,0.7)",
  },
  dataSourceLinkRowPressed: {
    borderColor: colors.textStrong,
    transform: [{ scale: 0.99 }],
  },
  dataSourceLinkLabel: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  dataSourceLinkUrl: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.78,
  },
});
