import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  year: number;
  metrics: Array<{ label: string; value: string; detail: string }>;
  countries: Country[];
};

function DashboardSection({
  children,
  style,
  fillVariant = "default",
  contentStyle,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  fillVariant?: "default" | "softBlue" | "comparisonBlue";
  contentStyle?: ViewStyle | ViewStyle[];
}) {
  return (
    <Panel style={[styles.sectionPanel, style]}>
      {fillVariant === "softBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#5D6983", colors.backgroundBottom]}
          locations={[0, 0.48, 0.82, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sectionFill}
        />
      ) : fillVariant === "comparisonBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#70536A"]}
          locations={[0, 0.38, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sectionFill}
        />
      ) : (
        <SecondarySurfaceFill />
      )}
      <View style={[styles.sectionContent, contentStyle]}>{children}</View>
    </Panel>
  );
}

function DashboardStatSquare({ label, value }: { label: string; value: string }) {
  return (
    <DashboardSection style={styles.statSquare} contentStyle={styles.statSquareContent}>
      <View style={styles.statSquareValueWrap}>
        <Text style={styles.statSquareValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
      <Text style={styles.statSquareLabel} numberOfLines={2}>
        Statistic Here
      </Text>
    </DashboardSection>
  );
}

function SectionTitle({ title, subtitle, darkText = false }: { title: string; subtitle?: string; darkText?: boolean }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={[styles.sectionTitle, darkText ? styles.darkSectionTitle : null]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, darkText ? styles.darkSectionSubtitle : null]}>{subtitle}</Text> : null}
    </View>
  );
}

function PlaceholderLineChart({ darkText = false }: { darkText?: boolean }) {
  const points = [78, 56, 62, 44, 49, 31, 38, 22, 34];

  return (
    <View style={styles.lineChartShell}>
      <View style={styles.lineChartGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.lineChartGridLine} />
        ))}
      </View>
      <View style={styles.lineChartPointsRow}>
        {points.map((value, index) => (
          <View key={index} style={styles.lineChartPointColumn}>
            <View style={{ height: value }} />
            <View style={styles.lineChartPoint} />
            {index < points.length - 1 ? <View style={styles.lineChartConnector} /> : null}
          </View>
        ))}
      </View>
      <View style={styles.lineChartLabels}>
        {["Q1", "Q2", "Q3", "Q4", "Q5"].map((label) => (
          <Text key={label} style={[styles.chartAxisLabel, darkText ? styles.darkChartAxisLabel : null]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function PlaceholderBars({
  values,
  horizontal = false,
  darkText = false,
}: {
  values: number[];
  horizontal?: boolean;
  darkText?: boolean;
}) {
  return (
    <View style={horizontal ? styles.horizontalBars : styles.verticalBars}>
      {values.map((value, index) => (
        <View key={index} style={horizontal ? styles.horizontalBarRow : styles.verticalBarColumn}>
          {horizontal ? (
            <>
              <Text style={[styles.chartAxisLabel, darkText ? styles.darkChartAxisLabel : null]}>{`Item ${index + 1}`}</Text>
              <View style={styles.horizontalBarTrack}>
                <View style={[styles.horizontalBarFill, { width: `${value}%` }]} />
              </View>
            </>
          ) : (
            <>
              <View style={[styles.verticalBarFill, { height: `${value}%` }]} />
              <Text style={[styles.chartAxisLabel, darkText ? styles.darkChartAxisLabel : null]}>{`${index + 1}`}</Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

function PlaceholderDonutLegend({ labels, darkText = false }: { labels: string[]; darkText?: boolean }) {
  return (
    <View style={styles.donutLayout}>
      <View style={styles.donutShell}>
        <View style={styles.donutInner} />
      </View>
      <View style={styles.donutLegend}>
        {labels.map((label, index) => (
          <View key={label} style={styles.legendRow}>
            <View style={[styles.legendDot, { opacity: 1 - index * 0.14 }]} />
            <Text style={[styles.legendLabel, darkText ? styles.darkLegendLabel : null]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DashboardScreenContent({ year, metrics, countries }: Props) {
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

  const featuredItems = useMemo(
    () => [
      "Featured Thing 1",
      "Featured Thing 2",
      "Featured Thing 3",
      "Featured Thing 4",
      "Featured Thing 5",
      "Featured Thing 6",
      "Featured Thing 7",
      "Featured Thing 8",
    ],
    []
  );
  const statItems = useMemo(
    () => [
      { label: metrics[0]?.label ?? "Countries Tracked", value: metrics[0]?.value ?? "0", note: metrics[0]?.detail ?? "placeholder" },
      { label: metrics[1]?.label ?? "Hidden Songs Indexed", value: metrics[1]?.value ?? "0", note: metrics[1]?.detail ?? "placeholder" },
      {
        label: metrics[2]?.label ?? "Busiest Region",
        value: "87",
        note: metrics[2] ? "Highest hidden-song concentration in current data." : "placeholder",
      },
      { label: "Current Year", value: `${year}`, note: "selected year" },
      { label: "Countries in View", value: `${countries.length}`, note: "current map slice" },
      { label: "Genre Buckets", value: "12", note: "placeholder" },
      { label: "Language Buckets", value: "9", note: "placeholder" },
    ],
    [countries.length, metrics, year]
  );

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
            heading="Dashboard"
            body="this is the text inside the blurb that will say things about the page you're on and will guide users through the experience. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
          />

          <View style={styles.topOverviewRow}>
            <View style={styles.statStripRow}>
              {statItems.map((item) => (
                <DashboardStatSquare key={item.label} label={item.label} value={item.value} />
              ))}
            </View>

            <DashboardSection style={styles.topFillSection} fillVariant="softBlue">
              <SectionTitle
                title="Featured Things Example"
                subtitle="General example summary panel filling the remaining dashboard row space."
                darkText
              />
            </DashboardSection>
          </View>

          <View style={styles.heroRow}>
            <DashboardSection style={styles.heroChartSection} fillVariant="comparisonBlue">
              <SectionTitle
                title="Dot Graph Example"
                subtitle={`General example chart using placeholder movement points for ${year}.`}
                darkText
              />
              <PlaceholderLineChart darkText />
            </DashboardSection>

            <View style={styles.heroSideColumn}>
              <DashboardSection style={styles.stackCard} fillVariant="softBlue">
                <SectionTitle title="Bar Graph Example" subtitle="General example bar module with placeholder values." darkText />
                <PlaceholderBars values={[72, 54, 61, 48]} horizontal darkText />
              </DashboardSection>
              <DashboardSection style={styles.stackCard}>
                <SectionTitle title="Bar Graph Example" subtitle="General example vertical chart with placeholder values." />
                <PlaceholderBars values={[84, 62, 40, 73, 58]} />
              </DashboardSection>
            </View>
          </View>

          <View style={styles.tripleRow}>
            <DashboardSection style={styles.smallChartSection} fillVariant="softBlue">
              <SectionTitle title="Pie Chart Example" subtitle="General example mix chart" darkText />
              <PlaceholderDonutLegend labels={["Segment 1", "Segment 2", "Segment 3", "Segment 4"]} darkText />
            </DashboardSection>

            <DashboardSection style={styles.smallChartSection} fillVariant="comparisonBlue">
              <SectionTitle title="Pie Chart Example" subtitle="General example mix chart" darkText />
              <PlaceholderDonutLegend labels={["Slice A", "Slice B", "Slice C", "Slice D"]} darkText />
            </DashboardSection>

            <DashboardSection style={styles.smallChartSection}>
              <SectionTitle title="Bar Graph Example" subtitle="General example ranking chart" />
              <PlaceholderBars values={[88, 72, 61, 43, 31]} horizontal />
            </DashboardSection>
          </View>

          <DashboardSection style={styles.wideSection} fillVariant="softBlue">
            <SectionTitle title="Featured Things Example" subtitle="General example feature grouping using placeholder items." darkText />
            <View style={styles.countryChipRow}>
              {featuredItems.map((item) => (
                <View key={item} style={styles.countryChip}>
                  <Text style={[styles.countryChipText, styles.darkCountryChipText]}>{item}</Text>
                </View>
              ))}
            </View>
            <PlaceholderBars values={[76, 64, 59, 55, 48, 37]} horizontal />
          </DashboardSection>

          <View style={styles.bottomRow}>
            <DashboardSection style={styles.bottomSection}>
              <SectionTitle title="List Example" subtitle="General example ranked placeholder list" />
              <View style={styles.rankList}>
                {["List Item A", "List Item B", "List Item C", "List Item D", "List Item E"].map((label, index) => (
                  <View key={label} style={styles.rankRow}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                    <Text style={styles.rankLabel}>{label}</Text>
                    <Text style={styles.rankValue}>{`${92 - index * 7}%`}</Text>
                  </View>
                ))}
              </View>
            </DashboardSection>

            <DashboardSection style={styles.bottomSection} fillVariant="comparisonBlue">
              <SectionTitle title="Dot Graph Example" subtitle="General example grid with placeholder emphasis points." darkText />
              <View style={styles.matrixGrid}>
                {Array.from({ length: 12 }).map((_, index) => (
                  <View key={index} style={[styles.matrixCell, { opacity: 0.28 + (index % 4) * 0.14 }]} />
                ))}
              </View>
            </DashboardSection>
          </View>

          <DashboardSection style={styles.wideSection}>
            <SectionTitle
              title="Featured Things Example"
              subtitle="General example card set showing placeholder dashboard modules."
            />
            <View style={styles.placeholderCardGrid}>
              {["Example Card A", "Example Card B", "Example Card C", "Example Card D"].map((label) => (
                <View key={label} style={styles.placeholderCard}>
                  <Text style={styles.placeholderCardTitle}>{label}</Text>
                  <View style={styles.placeholderCardLines}>
                    <View style={styles.placeholderCardLineLong} />
                    <View style={styles.placeholderCardLineShort} />
                    <View style={styles.placeholderCardLineMedium} />
                  </View>
                </View>
              ))}
            </View>
          </DashboardSection>
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

export function DashboardScreen(props: Props) {
  return <DashboardScreenContent {...props} />;
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
  sectionPanel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  sectionFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionContent: {
    padding: 18,
    gap: 16,
  },
  sectionTitleWrap: {
    gap: 6,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 24,
    lineHeight: 28,
  },
  darkSectionTitle: {
    color: "rgba(15,16,21,0.92)",
  },
  sectionSubtitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  darkSectionSubtitle: {
    color: "rgba(15,16,21,0.8)",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  topOverviewRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  statStripRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "nowrap",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  topFillSection: {
    flex: 1,
    minWidth: 220,
    height: 96,
  },
  statSquare: {
    width: 96,
    minWidth: 96,
    maxWidth: 96,
    height: 96,
    flexShrink: 0,
    borderWidth: 2,
    borderColor: "rgba(117, 82, 107, 0.42)",
    shadowColor: colors.accent,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  statSquareContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 3,
    justifyContent: "space-between",
  },
  statSquareValueWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  statSquareLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
  },
  statSquareValue: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 30,
    lineHeight: 32,
    textAlign: "center",
    paddingHorizontal: 3,
    overflow: "visible",
  },
  heroRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  heroChartSection: {
    flex: 1.35,
    minWidth: 420,
    minHeight: 560,
  },
  heroSideColumn: {
    flex: 0.85,
    minWidth: 300,
    gap: 16,
  },
  stackCard: {
    minHeight: 172,
  },
  tripleRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  smallChartSection: {
    flex: 1,
    minWidth: 260,
    minHeight: 240,
  },
  wideSection: {
    minHeight: 260,
  },
  bottomRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  bottomSection: {
    flex: 1,
    minWidth: 360,
    minHeight: 300,
  },
  lineChartShell: {
    flex: 1,
    minHeight: 420,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(15,16,21,0.42)",
    backgroundColor: "rgba(22,26,38,0.16)",
    padding: 16,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  lineChartGrid: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-evenly",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  lineChartGridLine: {
    height: 1,
    backgroundColor: "rgba(15,16,21,0.24)",
  },
  lineChartPointsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flex: 1,
    paddingTop: 12,
  },
  lineChartPointColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  lineChartPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textStrong,
    borderWidth: 2,
    borderColor: colors.border,
    zIndex: 2,
  },
  lineChartConnector: {
    position: "absolute",
    right: "-50%",
    top: "50%",
    width: "100%",
    height: 2,
    backgroundColor: colors.accent,
    opacity: 0.6,
  },
  lineChartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartAxisLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 16,
  },
  darkChartAxisLabel: {
    color: "rgba(15,16,21,0.78)",
  },
  verticalBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 150,
    gap: 10,
  },
  verticalBarColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    minHeight: 150,
  },
  verticalBarFill: {
    width: "100%",
    maxWidth: 34,
    minHeight: 18,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  horizontalBars: {
    gap: 10,
  },
  horizontalBarRow: {
    gap: 6,
  },
  horizontalBarTrack: {
    width: "100%",
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(15,16,21,0.24)",
  },
  horizontalBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.backgroundSoft,
  },
  donutLayout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  donutShell: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  donutInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  donutLegend: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  legendLabel: {
    flex: 1,
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  darkLegendLabel: {
    color: "rgba(15,16,21,0.82)",
  },
  countryChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  countryChip: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countryChipText: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  darkCountryChipText: {
    color: "rgba(15,16,21,0.88)",
  },
  rankList: {
    gap: 10,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rankNumber: {
    width: 24,
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 18,
    lineHeight: 20,
  },
  rankLabel: {
    flex: 1,
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
  },
  rankValue: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  matrixGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  matrixCell: {
    width: "23%",
    minWidth: 92,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: colors.textStrong,
  },
  placeholderCardGrid: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  placeholderCard: {
    flex: 1,
    minWidth: 220,
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.16)",
    padding: 14,
    gap: 14,
  },
  placeholderCardTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  darkPlaceholderCardTitle: {
    color: "rgba(15,16,21,0.9)",
  },
  placeholderCardLines: {
    gap: 10,
  },
  placeholderCardLineLong: {
    width: "100%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(108,119,142,0.5)",
  },
  placeholderCardLineMedium: {
    width: "72%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(108,119,142,0.36)",
  },
  placeholderCardLineShort: {
    width: "48%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(108,119,142,0.28)",
  },
});
