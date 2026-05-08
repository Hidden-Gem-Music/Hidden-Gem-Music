import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  loadDiscoveryGap,
  loadGapDistribution,
  loadIsolationLeader,
  loadIsolationRanking,
  loadOverlapRate,
  loadOverlapTrend,
  loadPeakReach,
} from "../data/dashboardApi";
import type {
  ApiDiscoveryGap,
  ApiGapBucket,
  ApiIsolationEntry,
  ApiIsolationLeader,
  ApiOverlapRate,
  ApiPeakReach,
  ApiTrendPoint,
} from "../types/api";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SecondarySurfaceFill } from "../components/SecondarySurfaceFill";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";


export type Props = Record<string, never>;

// ---------------------------------------------------------------------------
// Shared layout primitives
// ---------------------------------------------------------------------------

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

function SectionTitle({
  title,
  subtitle,
  darkText = false,
}: {
  title: string;
  subtitle?: string;
  darkText?: boolean;
}) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={[styles.sectionTitle, darkText ? styles.darkSectionTitle : null]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionSubtitle, darkText ? styles.darkSectionSubtitle : null]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={styles.sectionLabelWrap}>
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// KPI Cards
// ---------------------------------------------------------------------------

function KpiBadge({ label, variant }: { label: string; variant: "danger" | "warning" | "success" }) {
  const bg =
    variant === "danger"
      ? "rgba(248,113,113,0.18)"
      : variant === "warning"
      ? "rgba(251,146,60,0.18)"
      : "rgba(74,222,128,0.18)";
  const textColor =
    variant === "danger" ? "#f87171" : variant === "warning" ? "#fb923c" : "#4ade80";
  return (
    <View style={[styles.kpiBadge, { backgroundColor: bg }]}>
      <Text style={[styles.kpiBadgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function KpiOverlapRateCard({
  data,
  trendDirection,
}: {
  data: ApiOverlapRate;
  trendDirection: "up" | "down" | "flat";
}) {
  return (
    <DashboardSection style={styles.kpiCard}>
      <Text style={styles.kpiCardLabel}>Global Overlap Rate</Text>
      <View style={styles.kpiHeadlineRow}>
        <Text style={styles.kpiHeadlineNumber}>{Math.round(data.overlapPct)}%</Text>
      </View>
      <Text style={styles.kpiCardBody}>of charting songs{"\n"}appear in 2+ countries</Text>
      <KpiBadge
        label={trendDirection === "down" ? "▼ siloed market" : "▲ growing overlap"}
        variant={trendDirection === "down" ? "danger" : "success"}
      />
      <Text style={styles.kpiExplainer}>
        Only {Math.round(data.overlapPct)}% of the {(data.totalUniqueSongs / 1000).toFixed(0)}k unique charting
        songs in this dataset appeared in more than one country's charts. The remaining{" "}
        {100 - Math.round(data.overlapPct)}% never crossed a single border — music markets are far more
        siloed than global streaming access would suggest.
      </Text>
    </DashboardSection>
  );
}

function KpiDiscoveryGapCard({ data }: { data: ApiDiscoveryGap }) {
  return (
    <DashboardSection style={styles.kpiCard}>
      <Text style={styles.kpiCardLabel}>Avg Discovery Gap</Text>
      <View style={styles.kpiHeadlineRow}>
        <Text style={styles.kpiHeadlineNumber}>{data.avgGapDays}</Text>
        <Text style={styles.kpiHeadlineUnit}> days</Text>
      </View>
      <Text style={styles.kpiCardBody}>before a song crosses{"\n"}its first border</Text>
      <View style={styles.kpiMedianRow}>
        <Text style={styles.kpiMedianText}>median: {data.medianGapDays} days</Text>
      </View>
      <Text style={styles.kpiExplainer}>
        When a song first charts somewhere, it takes an average of {data.avgGapDays} days before it
        appears in a second country. The median of {data.medianGapDays} days reveals the story —
        most crossovers happen fast, but a long tail of slow-traveling songs pulls the mean up significantly.
      </Text>
    </DashboardSection>
  );
}

function KpiIsolationCard({ data }: { data: ApiIsolationLeader }) {
  return (
    <DashboardSection style={styles.kpiCard}>
      <Text style={styles.kpiCardLabel}>Most Isolated Region</Text>
      <Text style={styles.kpiIsolationName}>{data.countryName}</Text>
      <Text style={styles.kpiCardBody}>{Math.round(data.isolationScore)}% locally unique{"\n"}chart songs</Text>
      <KpiBadge label="highest isolation score" variant="danger" />
      <Text style={styles.kpiExplainer}>
        {Math.round(data.isolationScore)}% of songs that charted in {data.countryName} appeared nowhere else
        in the dataset. This is the highest isolation score of any qualifying country — meaning{" "}
        {data.countryName}'s chart is the least connected to global music trends out of all 73 markets tracked.
      </Text>
    </DashboardSection>
  );
}

function KpiPeakReachCard({ data }: { data: ApiPeakReach }) {
  const peakDateObj = data.peakDate ? new Date(data.peakDate) : null;
  const year = peakDateObj ? peakDateObj.getFullYear() : null;
  const month = peakDateObj
    ? peakDateObj.toLocaleString("default", { month: "short" })
    : null;

  return (
    <DashboardSection style={styles.kpiCard}>
      <Text style={styles.kpiCardLabel}>Peak Cross-Regional Reach</Text>
      <View style={styles.kpiHeadlineRow}>
        <Text style={styles.kpiHeadlineNumber}>{data.peakCountryCount}</Text>
        <Text style={styles.kpiHeadlineUnit}> countries</Text>
      </View>
      <Text style={styles.kpiCardBody}>simultaneous chart{"\n"}presence</Text>
      <View style={styles.kpiVinylMini}>
        <View style={styles.kpiVinylAlbumArt}>
          <View style={styles.kpiVinylRecord} />
        </View>
        <View style={styles.kpiVinylInfo}>
          <Text style={styles.kpiVinylTitle} numberOfLines={1}>{data.songTitle}</Text>
          <Text style={styles.kpiVinylArtist} numberOfLines={1}>{data.artistName}</Text>
        </View>
        {month && year ? (
          <View style={styles.kpiVinylDateBadge}>
            <Text style={styles.kpiVinylDateText}>{month}{"\n"}{year}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.kpiExplainer}>
        The ceiling of the discovery gap: {data.songTitle} by {data.artistName} charted simultaneously
        in {data.peakCountryCount} countries at once. When the average song only reaches{" "}
        ~4 countries total, a song hitting {data.peakCountryCount} makes the gap between outliers and
        the norm impossible to ignore.
      </Text>
    </DashboardSection>
  );
}

// ---------------------------------------------------------------------------
// Recharts shared style constants
// ---------------------------------------------------------------------------

const tooltipStyle = {
  backgroundColor: colors.backgroundRaised,
  border: "1px solid rgba(117,130,160,0.3)",
  borderRadius: 8,
  fontSize: 12,
};
const tooltipLabelStyle = { color: colors.textLight };
const tooltipItemStyle = { color: colors.textLight };
const tickStyle = { fill: colors.textLight, fontSize: 11, opacity: 0.7 };
const smallTickStyle = { fill: colors.textLight, fontSize: 10, opacity: 0.7 };

// ---------------------------------------------------------------------------
// Chart: Global Overlap Rate Over Time (Recharts Line)
// ---------------------------------------------------------------------------

function OverlapTrendChart({ data }: { data: ApiTrendPoint[] }) {
  const chartData = data.map((p) => ({
    periodLabel: p.periodLabel,
    overlapPct: p.isGap ? null : p.overlapPct,
    isGap: p.isGap,
  }));

  const gapPoints = data.filter((p) => p.isGap);
  const firstGapLabel = gapPoints[0]?.periodLabel;
  const lastGapLabel = gapPoints[gapPoints.length - 1]?.periodLabel;

  return (
    <View style={styles.lineChartShell}>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(117,130,160,0.15)" vertical={false} />
            <XAxis dataKey="periodLabel" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              formatter={(value) =>
                value !== null ? [`${value}%`, "Overlap rate"] : ["—", "No data"]
              }
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            {firstGapLabel && lastGapLabel ? (
              <ReferenceArea
                x1={firstGapLabel}
                x2={lastGapLabel}
                fill="rgba(129,140,248,0.07)"
                stroke="rgba(129,140,248,0.3)"
                strokeDasharray="3 3"
                label={{ value: "data gap", fill: "#818cf8", fontSize: 10 }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="overlapPct"
              stroke={colors.accent}
              strokeWidth={2}
              dot={{ r: 5, fill: colors.accent, stroke: colors.background, strokeWidth: 2 }}
              activeDot={{ r: 7 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </View>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: colors.accent }]} />
          <Text style={styles.chartLegendText}>Overlap rate %</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View
            style={[
              styles.chartLegendSwatch,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "#818cf8",
                borderStyle: "dashed" as any,
              },
            ]}
          />
          <Text style={styles.chartLegendText}>Data gap (22 months)</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chart: Regional Isolation Scores (Recharts horizontal Bar)
// ---------------------------------------------------------------------------

const ISOLATION_COLORS: Record<string, string> = {
  high: "#f87171",
  mid: "#fb923c",
  low: "#4ade80",
};

function IsolationBarChart({ data }: { data: ApiIsolationEntry[] }) {
  const chartHeight = Math.max(data.length * 38 + 40, 240);

  return (
    <View style={styles.isolationChartShell}>
      <View style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="countryName"
              width={90}
              tick={{ fill: colors.textLight, fontSize: 12, opacity: 0.85 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Isolation score"]}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Bar dataKey="isolationScore" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ISOLATION_COLORS[entry.isolationTier] ?? ISOLATION_COLORS.mid}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </View>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#f87171" }]} />
          <Text style={styles.chartLegendText}>High isolation</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#fb923c" }]} />
          <Text style={styles.chartLegendText}>Mid</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#4ade80" }]} />
          <Text style={styles.chartLegendText}>Low isolation</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chart: Discovery Gap Distribution (Recharts vertical Bar)
// ---------------------------------------------------------------------------

function GapDistributionChart({ data }: { data: ApiGapBucket[] }) {
  return (
    <View style={styles.lineChartShell}>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(117,130,160,0.15)" vertical={false} />
            <XAxis dataKey="bucketLabel" tick={smallTickStyle} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              formatter={(value) => [Number(value).toLocaleString(), "Songs"]}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Bar dataKey="songCount" fill="#818cf8" fillOpacity={0.72} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </View>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#818cf8", opacity: 0.7 }]} />
          <Text style={styles.chartLegendText}>Songs by gap length (days)</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chart: Global Reach Over Time (Recharts vertical Bar)
// ---------------------------------------------------------------------------

function GlobalReachChart({ data }: { data: ApiTrendPoint[] }) {
  const nonGapData = data.filter((p) => !p.isGap);

  const CustomXTick = ({ x, y, payload }: any) => {
    const isPartial = payload.value === 2023;
    return (
      <text
        x={x}
        y={y + 10}
        textAnchor="middle"
        fill={isPartial ? "#fb923c" : "rgba(117,130,160,0.7)"}
        fontSize={11}
        fontFamily={typefaces.body}
      >
        {payload.value}{isPartial ? "*" : ""}
      </text>
    );
  };

  return (
    <View style={styles.lineChartShell}>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={nonGapData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(117,130,160,0.15)" vertical={false} />
            <XAxis
              dataKey="periodYear"
              tick={<CustomXTick />}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => Number(v).toFixed(1)}
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              formatter={(value) => [Number(value).toFixed(2), "Avg countries"]}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              labelFormatter={(label) =>
                label === 2023 ? `${label} (Oct–Dec only)` : `${label}`
              }
            />
            <Bar dataKey="avgCountries" fill="#34d399" fillOpacity={0.75} radius={[4, 4, 0, 0]}>
              {nonGapData.map((entry) => (
                <Cell
                  key={entry.periodYear}
                  fill="#34d399"
                  fillOpacity={entry.periodYear === 2023 ? 0.45 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </View>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#34d399", opacity: 0.75 }]} />
          <Text style={styles.chartLegendText}>Avg countries per song</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#34d399", opacity: 0.45 }]} />
          <Text style={styles.chartLegendText}>Partial year (Oct–Dec only)</Text>
        </View>
      </View>
      <Text style={styles.chartFootnote}>
        * 2023 reflects Oct–Dec data only. DS2 years (2023–2025) use Top 50 charts vs DS1's Top 200 — averages are not directly comparable across the gap.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen — fetches all dashboard data on mount
// ---------------------------------------------------------------------------

function DashboardScreenContent() {
  const { width } = useWindowDimensions();
  const isMobileWidth = width < 980;
  const [overlapRate, setOverlapRate] = useState<ApiOverlapRate | null>(null);
  const [discoveryGap, setDiscoveryGap] = useState<ApiDiscoveryGap | null>(null);
  const [isolationLeader, setIsolationLeader] = useState<ApiIsolationLeader | null>(null);
  const [peakReach, setPeakReach] = useState<ApiPeakReach | null>(null);
  const [trendData, setTrendData] = useState<ApiTrendPoint[]>([]);
  const [isolationRanking, setIsolationRanking] = useState<ApiIsolationEntry[]>([]);
  const [gapDistribution, setGapDistribution] = useState<ApiGapBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const start = "2017-01-01";
    const end = "2025-12-31";
    Promise.all([
      loadOverlapRate(start, end),
      loadDiscoveryGap(start, end),
      loadIsolationLeader(start, end),
      loadPeakReach(start, end),
      loadOverlapTrend(start, end),
      loadIsolationRanking(start, end),
      loadGapDistribution(start, end),
    ])
      .then(([rate, gap, leader, reach, trend, ranking, distribution]) => {
        setOverlapRate(rate);
        setDiscoveryGap(gap);
        setIsolationLeader(leader);
        setPeakReach(reach);
        setTrendData(trend);
        setIsolationRanking(ranking);
        setGapDistribution(distribution);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : "Failed to load dashboard data");
        setLoading(false);
      });
  }, []);

  const trendDirection = useMemo((): "up" | "down" | "flat" => {
    const nonGap = trendData.filter((p) => !p.isGap && p.overlapPct > 0);
    if (nonGap.length < 2) return "flat";
    const last = nonGap[nonGap.length - 1].overlapPct;
    const prev = nonGap[nonGap.length - 2].overlapPct;
    if (last > prev) return "up";
    if (last < prev) return "down";
    return "flat";
  }, [trendData]);

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
  const pageThumbTop = pageHasOverflow
    ? (pageScrollY / (pageContentHeight - pageViewportHeight)) * (pageViewportHeight - pageThumbHeight)
    : 0;

  const handlePageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPageScrollY(event.nativeEvent.contentOffset.y);
  };

  const scrollPageToTrackLocation = (locationY: number) => {
    if (!pageHasOverflow || pageContentHeight <= pageViewportHeight) return;
    const nextThumbTop = Math.min(
      Math.max(locationY - pageThumbHeight / 2, 0),
      pageTrackHeight - pageThumbHeight
    );
    const nextRatio = nextThumbTop / (pageTrackHeight - pageThumbHeight);
    const nextScrollY = nextRatio * (pageContentHeight - pageViewportHeight);
    pageScrollRef.current?.scrollTo({ y: nextScrollY, animated: false });
    setPageScrollY(nextScrollY);
  };

  const scrollPageToClientY = (clientY: number) => {
    const rect = (pageTrackRef.current as any)?.getBoundingClientRect?.();
    if (!rect) return;
    scrollPageToTrackLocation(clientY - rect.top);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || !isDraggingPageScrollbar || typeof document === "undefined") return;
    const previousUserSelect = document.body.style.userSelect;
    const handleMove = (event: MouseEvent) => {
      event.preventDefault();
      scrollPageToClientY(event.clientY);
    };
    const handleUp = () => setIsDraggingPageScrollbar(false);
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingPageScrollbar, pageHasOverflow, pageThumbHeight, pageTrackHeight, pageContentHeight, pageViewportHeight]);

  if (loading || fetchError) {
    return (
      <ScreenScaffold>
        <View style={styles.pageScrollFrame}>
          <View style={styles.statusShell}>
            <Text style={[styles.statusText, fetchError ? styles.statusError : null]}>
              {fetchError ?? "Loading dashboard data…"}
            </Text>
          </View>
        </View>
      </ScreenScaffold>
    );
  }

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
          {/* —— Page header —— */}
          <DiscoveryBlurb
            heading="Global Overlap Dashboard"
            body="This dashboard is the analytical answer to the Discovery Gap question: which globally trending artists and songs are missing from local markets, and how do those patterns change over time? Every number here is derived from 28 million chart entries across 73 countries spanning 2017–2021 and 2023–2025. The 22-month data gap between datasets is marked clearly wherever it appears in trend charts."
          />

          {/* —— KPI section —— */}
          <SectionLabel label="KEY PERFORMANCE INDICATORS" />

          <View style={styles.kpiRow}>
            {overlapRate ? (
              <KpiOverlapRateCard data={overlapRate} trendDirection={trendDirection} />
            ) : null}
            {discoveryGap ? <KpiDiscoveryGapCard data={discoveryGap} /> : null}
            {isolationLeader ? <KpiIsolationCard data={isolationLeader} /> : null}
            {peakReach ? <KpiPeakReachCard data={peakReach} /> : null}
          </View>

          {/* —— Trend analysis section —— */}
          <SectionLabel label="TREND ANALYSIS" />

          {/* Row 1: Overlap trend + Isolation ranking */}
          <View style={styles.chartRow}>
            <DashboardSection style={styles.chartCardWide}>
              <SectionTitle
                title="Global Overlap Rate Over Time"
                subtitle="% of charting songs appearing in 2+ countries — annual, 2017–2025"
              />
              <Text style={styles.chartExplainer}>
                This line tracks what share of the global charting song pool was crossing borders in any
                given year. A rising line means music markets are becoming more connected; a falling line
                means they're pulling apart. The 22-month data gap (Dec 2021 – Oct 2023) is shaded — do
                not read continuity across that region.
              </Text>
              {trendData.length > 0 ? <OverlapTrendChart data={trendData} /> : null}
            </DashboardSection>

            <DashboardSection style={[styles.chartCardNarrow, isMobileWidth ? styles.chartCardNarrowMobile : null]}>
              <SectionTitle
                title="Regional Isolation Scores"
                subtitle="Countries ranked by % locally unique chart songs"
              />
              <Text style={styles.chartExplainer}>
                A country's isolation score = the share of its charting songs that appeared nowhere else.
                High scores (red) mean a market that barely intersects with global trends. Low scores
                (green) mean a market whose charts closely mirror what's popular everywhere.
              </Text>
              {isolationRanking.length > 0 ? <IsolationBarChart data={isolationRanking} /> : null}
            </DashboardSection>
          </View>

          {/* Row 2: Gap distribution + Global reach */}
          <View style={styles.chartRow}>
            <DashboardSection style={styles.chartCardHalf}>
              <SectionTitle
                title="Discovery Gap Distribution"
                subtitle="How many days until songs cross their first border"
              />
              <Text style={styles.chartExplainer}>
                Each bar shows how many songs took that long to appear in a second country after their
                debut chart entry. Most songs that cross a border do so within the first week — the 0-7 
                day bucket reflects how quickly streaming-era music spreads when it gains momentum, and 
                is partly driven by Viral 50 chart entries which capture simultaneous cross-market momentum 
                by design. The average of 38 days is pulled higher by a long tail of songs that took months 
                to travel or barely reached a second market. The gap between the median (4 days) and mean
                (38 days) is itself a finding: crossover is either fast or it doesn't happen. Songs in the 
                "90d+" bucket either took a very long time to travel or only barely made it to one other market
                before dropping off entirely.
              </Text>
              {gapDistribution.length > 0 ? <GapDistributionChart data={gapDistribution} /> : null}
            </DashboardSection>

            <DashboardSection style={styles.chartCardHalf}>
              <SectionTitle
                title="Global Reach Over Time"
                subtitle="Avg countries per charting song — annual, 2017–2025"
              />
              <Text style={styles.chartExplainer}>
                On average, how many countries did a charting song appear in that year? This is the
                macro view of the Discovery Gap: if the number stays low, most music stays local
                regardless of global streaming access.{"\n\n"}
                Two important caveats: DS1 years (2017–2021) draw from the Top 200 and Viral 50
                charts across 70+ countries, while DS2 years (2023–2025) draw from a Top 50 chart
                only — the smaller chart pool naturally produces lower averages and is not directly
                comparable. Additionally, 2023 reflects only Oct–Dec data, so its bar represents
                a partial year. Gap year 2022 is omitted entirely rather than shown as zero.
              </Text>
              {trendData.length > 0 ? <GlobalReachChart data={trendData} /> : null}
            </DashboardSection>
          </View>

          {/* —— Methodology note —— */}
          <DashboardSection style={styles.methodologyCard}>
            <SectionTitle title="About This Data" />
            <Text style={styles.methodologyBody}>
              All metrics on this dashboard are derived from two Kaggle datasets: Spotify Historical
              Charts (2017–2021) covering the Top 200 and Viral 50 across 70+ countries, and Top Spotify
              Songs in 73 Countries (2023–2025) covering daily Top 50 charts. Combined, these datasets
              represent approximately 28 million chart entries.
            </Text>
            <Text style={styles.methodologyBody}>
              <Text style={styles.methodologyBold}>Popularity metrics cannot be compared across datasets.</Text>
              {" "}Dataset 1 uses raw stream counts; Dataset 2 uses Spotify's proprietary 0–100 popularity
              score. These are stored separately and never merged.
            </Text>
            <Text style={styles.methodologyBody}>
              <Text style={styles.methodologyBold}>The 22-month data gap (Dec 2021 – Oct 2023)</Text>
              {" "}is a known limitation. No data exists for this period. Trend lines are broken — not
              interpolated — across this gap, and every time-series visualization on this page marks it
              explicitly.
            </Text>
            <Text style={styles.methodologyBody}>
              KPI calculations run in pre-computed SQL summary tables server-side and are never derived
              live from the raw 28M-row fact table. This ensures response times remain fast regardless
              of filter state.
            </Text>
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
            <View
              style={[
                styles.pageScrollbarThumb,
                { height: pageThumbHeight, transform: [{ translateY: pageThumbTop }] },
              ]}
            />
          </View>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export function DashboardScreen(_props: Props) {
  return <DashboardScreenContent />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // —— Scroll frame ——
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
    paddingBottom: 32,
    paddingRight: 18,
  },

  // —— Scrollbar ——
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

  // —— Section primitives ——
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
    gap: 14,
  },
  sectionTitleWrap: {
    gap: 5,
  },
  sectionTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  darkSectionTitle: {
    color: "rgba(15,16,21,0.92)",
  },
  sectionSubtitle: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  darkSectionSubtitle: {
    color: "rgba(15,16,21,0.8)",
  },

  // —— Section label ——
  sectionLabelWrap: {
    paddingHorizontal: 2,
  },
  sectionLabel: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase" as any,
    opacity: 0.7,
  },

  // —— KPI cards ——
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    maxWidth: 320,
  },
  kpiCardLabel: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.72,
  },
  kpiHeadlineRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  kpiHeadlineNumber: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 52,
    lineHeight: 56,
  },
  kpiHeadlineUnit: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 28,
    marginLeft: 2,
  },
  kpiIsolationName: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 36,
    lineHeight: 40,
  },
  kpiCardBody: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  kpiBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kpiBadgeText: {
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  kpiMedianRow: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kpiMedianText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 16,
  },
  kpiExplainer: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.75,
    borderTopWidth: 1,
    borderTopColor: "rgba(117,130,160,0.2)",
    paddingTop: 10,
    marginTop: 2,
  },

  // —— KPI Vinyl mini ——
  kpiVinylMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.4)",
    padding: 10,
  },
  kpiVinylAlbumArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(108,119,142,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiVinylRecord: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(15,16,21,0.8)",
    borderWidth: 4,
    borderColor: "rgba(108,119,142,0.5)",
  },
  kpiVinylInfo: {
    flex: 1,
    gap: 2,
  },
  kpiVinylTitle: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 14,
    lineHeight: 17,
  },
  kpiVinylArtist: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 15,
    opacity: 0.8,
  },
  kpiVinylDateBadge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: "center",
  },
  kpiVinylDateText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
    fontWeight: "700",
  },

  // —— Chart rows ——
  chartRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  chartCardWide: {
    flex: 1.3,
    minWidth: 380,
    minHeight: 440,
  },
  chartCardNarrow: {
    flex: 0.9,
    minWidth: 300,
    minHeight: 440,
  },
  chartCardNarrowMobile: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "100%",
    alignSelf: "stretch",
    width: "100%",
    maxWidth: "100%",
    minWidth: 320,
  },
  chartCardHalf: {
    flex: 1,
    minWidth: 320,
    minHeight: 400,
  },

  // —— Recharts wrapper ——
  chartContainer: {
    height: 220,
  },

  // —— Explainer text in chart cards ——
  chartExplainer: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
  },
  
  // —— Footnote text in chart cards ——
  chartFootnote: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.55,
    paddingTop: 6,
  },

  // —— Legend ——
  chartLegendRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    paddingTop: 4,
  },
  chartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chartLegendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  chartLegendText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },

  // —— Line/bar chart shell ——
  lineChartShell: {
    flex: 1,
    minHeight: 240,
    flexDirection: "column",
    gap: 8,
  },
  isolationChartShell: {
    flex: 1,
    gap: 8,
  },

  // —— Methodology note ——
  methodologyCard: {
    marginTop: 4,
  },
  methodologyBody: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.75,
  },
  methodologyBold: {
    color: colors.textLight,
    fontWeight: "600",
    opacity: 1,
  },

  // —— Loading / error state ——
  statusShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  statusError: {
    color: "#f87171",
  },
});
