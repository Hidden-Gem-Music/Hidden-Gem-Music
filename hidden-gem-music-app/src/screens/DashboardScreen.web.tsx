import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  loadAvailableYears,
} from "../data/countryApi";
import {
  loadDiscoveryGap,
  loadGapDistribution,
  loadIsolationLeader,
  loadIsolationRanking,
  loadOverlapRate,
  loadOverlapTrend,
  loadPeakReach,
} from "../data/dashboardApi";
import { loadDiscoveryCountries } from "../data/discoveryApi";
import { isCountryWithAppData } from "../data/countryDisplay";
import type {
  ApiDiscoveryGap,
  ApiGapBucket,
  ApiIsolationEntry,
  ApiIsolationLeader,
  ApiOverlapRate,
  ApiPeakReach,
  ApiTrendPoint,
} from "../types/api";
import type { Country } from "../types/content";
import { CdCaseArt } from "../components/CdCaseArt";
import { GemIcon } from "../components/GemIcon";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  year?: number;
  metrics?: Array<{ label: string; value: string; detail: string }>;
  countries?: unknown[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Color swatches — same static palette as HiddenGemsScreen (Eli's pattern)
const rowBackdropColors = ["#B86A72", "#8B9BC0", "#8B5E7A", "#627F8A", "#C28C5E", "#7A7EB0"];

const HERO_GRADIENT = ["#1a0a2e", "#0f0e17", "#1a1030"] as const;
const HERO_GRADIENT_LOCATIONS = [0, 0.45, 1] as const;

const ISOLATION_COLORS: Record<string, string> = {
  high: "#f87171",
  mid: "#fb923c",
  low: "#4ade80",
};

const GLOBAL_AVG_ISOLATION = 56;

// Left accent bar colors for KPI cards
const KPI_BAR = {
  purple: colors.accent,
  blue: "#63b3ed",
  red: "#f87171",
  green: "#4ade80",
};

const KNOWN_PEAK_REACH_ART: Record<string, string> = {
  "stay (with justin bieber)|the kid laroi":
    "https://coverartarchive.org/release/9edb549d-b9cd-47b8-8b33-523b0bf8e301/front-500",
};

// ---------------------------------------------------------------------------
// Navigation helper (web only — avoids touching App.tsx)
// ---------------------------------------------------------------------------

function navigateTo(path: string) {
  if (typeof window !== "undefined") {
    window.location.href = path;
  }
}

function getKnownPeakReachArtUrl(songTitle?: string | null, artistName?: string | null) {
  const key = `${songTitle ?? ""}|${artistName ?? ""}`.trim().toLowerCase();
  return KNOWN_PEAK_REACH_ART[key];
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
const tooltipLabelStyle = { color: colors.textStrong };
const tooltipItemStyle = { color: colors.text };
const tickStyle = { fill: colors.text, fontSize: 11, opacity: 0.7 };

// ---------------------------------------------------------------------------
// Country Selector
// ---------------------------------------------------------------------------

type CountrySelectorOption = {
  isoCode: string;
  countryName: string;
  isolationScore: number | null;
  isolationTier: string | null;
};

async function loadDashboardCountriesWithAppData() {
  const years = await loadAvailableYears().catch(() => [2025]);
  const countrySets = await Promise.all(
    years.map((year) => loadDiscoveryCountries(year, []).catch(() => []))
  );
  const countriesByCode = new Map<string, Country>();

  countrySets.flat().forEach((country) => {
    if (!isCountryWithAppData(country)) return;
    const code = country.code.toUpperCase();
    const existing = countriesByCode.get(code);
    if (!existing || country.hiddenSongs > existing.hiddenSongs) {
      countriesByCode.set(code, country);
    }
  });

  return Array.from(countriesByCode.values());
}

function CountrySelector({
  data,
  selectedCountry,
  onSelect,
  onClear,
}: {
  data: CountrySelectorOption[];
  selectedCountry: CountrySelectorOption | null;
  onSelect: (entry: CountrySelectorOption) => void;
  onClear: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const tierLabel = (entry: CountrySelectorOption) => {
    if (entry.isolationScore === null) return null;
    if (entry.isolationScore > 65) return "highly isolated — most of your charts stay local";
    if (entry.isolationScore >= 40) return "moderately isolated — some crossover, a lot still stays home";
    return "well connected — your market overlaps heavily with global trends";
  };

  const rank = selectedCountry
    ? data
        .filter((entry) => entry.isolationScore !== null)
        .findIndex((e) => e.isoCode === selectedCountry.isoCode) + 1
    : null;
  const selectedTierLabel = selectedCountry ? tierLabel(selectedCountry) : null;

  return (
    <View style={styles.countrySelectorWrap}>
      <Pressable
        style={styles.countrySelectorPill}
        onPress={() => setIsOpen((v) => !v)}
      >
        <Text style={styles.countrySelectorText}>
          {selectedCountry
            ? `Viewing: ${selectedCountry.countryName}`
            : "See where your country fits in"}
        </Text>
        <Text style={styles.countrySelectorChevron}>{isOpen ? "▲" : "▼"}</Text>
      </Pressable>

      {isOpen ? (
        <View
          style={[
            styles.countryDropdown,
            Platform.OS === "web"
              ? ({ overflowY: "scroll", scrollbarWidth: "none" } as any)
              : null,
          ]}
        >
          {data.map((entry) => (
            <Pressable
              key={entry.isoCode}
              style={[
                styles.countryDropdownItem,
                selectedCountry?.isoCode === entry.isoCode
                  ? styles.countryDropdownItemSelected
                  : null,
              ]}
              onPress={() => {
                onSelect(entry);
                setIsOpen(false);
              }}
            >
              <Text style={styles.countryDropdownName}>{entry.countryName}</Text>
              {entry.isolationScore !== null ? (
                <View style={styles.countryDropdownMeta}>
                  <Text style={styles.countryDropdownScore}>
                    {Math.round(entry.isolationScore)}%
                  </Text>
                  <Text style={styles.countryDropdownCaption}>isolation score</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {selectedCountry ? (
        <View style={styles.countryBanner}>
          <View style={styles.countryBannerLeft}>
            <View style={styles.countryBannerDot} />
            <Text style={styles.countryBannerText}>
              <Text style={styles.countryBannerName}>{selectedCountry.countryName}</Text>
              {selectedCountry.isolationScore !== null && selectedTierLabel ? (
                <>
                  {" "}has an isolation score of{" "}
                  <Text style={styles.countryBannerName}>
                    {Math.round(selectedCountry.isolationScore)}%
                  </Text>
                  {" — "}{selectedTierLabel}.
                  {rank
                    ? ` It's ranked #${rank} of ${data.filter((entry) => entry.isolationScore !== null).length} countries in the current isolation ranking.`
                    : ""}
                </>
              ) : (
                " is available in the app data. Isolation ranking data was not returned for this country."
              )}
            </Text>
          </View>
          <Pressable onPress={onClear} style={styles.countryBannerClear}>
            <Text style={styles.countryBannerClearText}>✕ clear</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chapter layout primitives
// ---------------------------------------------------------------------------

function ChapterLabel({ num, title }: { num: number; title: string }) {
  return (
    <View style={styles.chapterLabelRow}>
      <View style={styles.chapterCircle}>
        <Text style={styles.chapterNumber}>{num}</Text>
      </View>
      <Text style={styles.chapterTitle}>{title}</Text>
    </View>
  );
}

function PullStat({
  number,
  unit,
  context,
}: {
  number: string;
  unit?: string;
  context: string;
}) {
  return (
    <View style={styles.pullStat}>
      <View style={styles.pullStatDisplay}>
        <Text style={styles.pullStatNumber}>{number}</Text>
        {unit ? <Text style={styles.pullStatUnit}>{unit}</Text> : null}
      </View>
      <Text style={styles.pullStatContext}>{context}</Text>
    </View>
  );
}

function ArgumentText({ children }: { children: ReactNode }) {
  return <Text style={styles.argument}>{children}</Text>;
}

function CtaButton({
  label,
  primary,
  onPress,
}: {
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.ctaButton,
        primary ? styles.ctaButtonPrimary : styles.ctaButtonSecondary,
        hovered ? styles.ctaButtonHovered : null,
      ]}
      {...(Platform.OS === "web"
        ? ({
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
          } as any)
        : {})}
    >
      <Text
        style={[
          styles.ctaButtonText,
          primary ? styles.ctaButtonTextPrimary : styles.ctaButtonTextSecondary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CtaRow({ children }: { children: ReactNode }) {
  return <View style={styles.ctaRow}>{children}</View>;
}

function WarningTag({ type, label }: { type: "orange" | "blue"; label: string }) {
  return (
    <View
      style={[
        styles.warningTag,
        type === "orange" ? styles.warningTagOrange : styles.warningTagBlue,
      ]}
    >
      <Text
        style={[
          styles.warningTagText,
          { color: type === "orange" ? "#fb923c" : "#63b3ed" },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ChapterCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.chapterCard}>
      <Text style={styles.chapterCardLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// KPI Flip Cards — left accent bar + content layout
// ---------------------------------------------------------------------------

function KpiCard({
  barColor,
  front,
  back,
}: {
  barColor: string;
  front: ReactNode;
  back: ReactNode;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Pressable
      style={[
        styles.kpiCard,
        flipped ? styles.kpiCardFlipped : null,
        Platform.OS === "web"
          ? ({ transition: "background-color 0.2s ease, border-color 0.2s ease" } as any)
          : null,
      ]}
      onPress={() => setFlipped((v) => !v)}
    >
      <View style={[styles.kpiAccentBar, { backgroundColor: barColor }]} />
      <View style={styles.kpiContent}>
        {flipped ? back : (
          <View style={styles.kpiFrontShell}>
            {front}
            <Text style={styles.kpiFlipHint}>flip ↻</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Custom bar shapes — DS1/DS2 visual treatment
// ---------------------------------------------------------------------------

const TrendBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (payload.isGap) {
    const cx = x + width / 2;
    return (
      <g>
        <line
          x1={cx} y1={y - 180} x2={cx} y2={y}
          stroke="#fb923c" strokeDasharray="4 3" strokeWidth={1.5}
        />
      </g>
    );
  }
  if (!height || height <= 0) return <g />;
  const isPost = payload.periodYear >= 2023;
  return (
    <g>
      <rect
        x={x + 1} y={y} width={Math.max(width - 2, 0)} height={height}
        fill={colors.accent} fillOpacity={isPost ? 0.25 : 0.65} rx={2} ry={2}
      />
      {isPost ? (
        <rect
          x={x + 1} y={y} width={Math.max(width - 2, 0)} height={height}
          fill="none" stroke={colors.accent} strokeDasharray="4 2" strokeWidth={1.5} rx={2} ry={2}
        />
      ) : null}
    </g>
  );
};

const ReachBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (payload.isGap) {
    const cx = x + width / 2;
    return (
      <g>
        <line
          x1={cx} y1={y - 180} x2={cx} y2={y}
          stroke="#fb923c" strokeDasharray="4 3" strokeWidth={1.5}
        />
      </g>
    );
  }
  if (!height || height <= 0) return <g />;
  const isPost = payload.periodYear >= 2023;
  return (
    <g>
      <rect
        x={x + 1} y={y} width={Math.max(width - 2, 0)} height={height}
        fill="#4ade80" fillOpacity={isPost ? 0.25 : 0.65} rx={2} ry={2}
      />
      {isPost ? (
        <rect
          x={x + 1} y={y} width={Math.max(width - 2, 0)} height={height}
          fill="none" stroke="#4ade80" strokeDasharray="4 2" strokeWidth={1.5} rx={2} ry={2}
        />
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Chart: Chapter 3 — Global Overlap Trend
// ---------------------------------------------------------------------------

function OverlapTrendChart({ data }: { data: ApiTrendPoint[] }) {
  const ds1 = data.filter((p) => !p.isGap && p.periodYear <= 2021);
  const ds2 = data.filter((p) => !p.isGap && p.periodYear >= 2023);
  const gapEntry: ApiTrendPoint = {
    periodYear: 2022, periodLabel: "gap", periodMonth: null,
    overlapPct: 0, avgCountries: 0, totalUniqueSongs: 0, songsIn2Plus: 0, isGap: true,
  };
  const chartData = [...ds1, gapEntry, ...ds2];

  const CustomXTick = ({ x, y, payload }: any) => {
    if (payload.value === 2022) {
      return (
        <text x={x} y={y + 12} textAnchor="middle" fill="#fb923c" fontSize={9} fontFamily={typefaces.body}>
          gap
        </text>
      );
    }
    const is2023 = payload.value === 2023;
    return (
      <text
        x={x} y={y + 12} textAnchor="middle"
        fill={is2023 ? "#fb923c" : "rgba(169,176,209,0.7)"}
        fontSize={11} fontFamily={typefaces.body}
      >
        {payload.value}{is2023 ? "*" : ""}
      </text>
    );
  };

  return (
    <View style={styles.chartShell}>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(117,130,160,0.15)" vertical={false} />
            <XAxis dataKey="periodYear" tick={<CustomXTick />} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={tickStyle} axisLine={false} tickLine={false} width={36}
            />
            <Tooltip
              formatter={(value: any) =>
                value && value > 0 ? [`${value}%`, "Overlap rate"] : ["—", "No data"]
              }
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Bar dataKey="overlapPct" shape={<TrendBar />} />
          </BarChart>
        </ResponsiveContainer>
      </View>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: colors.accent, opacity: 0.65 }]} />
          <Text style={styles.chartLegendText}>2017–2021 (Top 200 only)</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View
            style={[
              styles.chartLegendSwatch,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: colors.accent,
                borderStyle: "dashed" as any,
              },
            ]}
          />
          <Text style={styles.chartLegendText}>2023–2025 (Top 50 only — dimmed)</Text>
        </View>
        <Text style={[styles.chartLegendText, { color: "#fb923c" }]}>
          * 2023 = Oct–Dec only
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chart: Chapter 2 — Isolation Bar Chart
// ---------------------------------------------------------------------------

function IsolationBarChart({
  data,
  selectedCountry,
}: {
  data: ApiIsolationEntry[];
  selectedCountry: CountrySelectorOption | null;
}) {
  const chartHeight = Math.max(data.length * 28 + 40, 240);

  const CustomYTick = ({ x, y, payload }: any) => {
    const isSelected = selectedCountry && payload.value === selectedCountry.countryName;
    return (
      <g>
        <text
          x={x} y={y} dy={4} textAnchor="end"
          fill={isSelected ? colors.accent : "rgba(169,176,209,0.85)"}
          fontSize={11} fontWeight={isSelected ? "500" : "400"} fontFamily={typefaces.body}
        >
          {payload.value}
        </text>
        {isSelected ? (
          <>
            <rect x={x + 4} y={y - 7} width={24} height={14} rx={7} fill="rgba(117,82,107,0.18)" />
            <text
              x={x + 16} y={y + 3} textAnchor="middle"
              fill={colors.accent} fontSize={8} fontWeight="600" fontFamily={typefaces.body}
            >
              you
            </text>
          </>
        ) : null}
      </g>
    );
  };

  return (
    <View style={styles.isolationChartShell}>
      <View
        style={[
          styles.isolationScrollContainer,
          Platform.OS === "web"
            ? ({ overflowY: "scroll", scrollbarWidth: "none" } as any)
            : null,
        ]}
      >
        <View style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
              <XAxis
                type="number" domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={tickStyle} axisLine={false} tickLine={false}
              />
              <YAxis
                type="category" dataKey="countryName" width={100}
                tick={<CustomYTick />} axisLine={false} tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Isolation score"]}
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
              />
              <ReferenceLine x={GLOBAL_AVG_ISOLATION} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <Bar dataKey="isolationScore" radius={[0, 4, 4, 0]} barSize={16}>
                {data.map((entry, index) => {
                  const isSelected = selectedCountry?.isoCode === entry.isoCode;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={ISOLATION_COLORS[entry.isolationTier] ?? ISOLATION_COLORS.mid}
                      fillOpacity={0.85}
                      stroke={isSelected ? "rgba(117,82,107,0.65)" : "none"}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </View>
      </View>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#f87171" }]} />
          <Text style={styles.chartLegendText}>High isolation ({">"} 65%)</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#fb923c" }]} />
          <Text style={styles.chartLegendText}>Mid (40–65%)</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#4ade80" }]} />
          <Text style={styles.chartLegendText}>Low ({"<"} 40%)</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View style={{ width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.15)" }} />
          <Text style={styles.chartLegendText}>global avg (56%)</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chart: Chapter 4 — Global Reach Over Time
// ---------------------------------------------------------------------------

function GlobalReachChart({ data }: { data: ApiTrendPoint[] }) {
  const ds1 = data.filter((p) => !p.isGap && p.periodYear <= 2021);
  const ds2 = data.filter((p) => !p.isGap && p.periodYear >= 2023);
  const gapEntry: ApiTrendPoint = {
    periodYear: 2022, periodLabel: "gap", periodMonth: null,
    overlapPct: 0, avgCountries: 0, totalUniqueSongs: 0, songsIn2Plus: 0, isGap: true,
  };
  const chartData = [...ds1, gapEntry, ...ds2];

  const CustomXTick = ({ x, y, payload }: any) => {
    if (payload.value === 2022) {
      return (
        <text x={x} y={y + 12} textAnchor="middle" fill="#fb923c" fontSize={9} fontFamily={typefaces.body}>
          gap
        </text>
      );
    }
    const is2023 = payload.value === 2023;
    return (
      <text
        x={x} y={y + 12} textAnchor="middle"
        fill={is2023 ? "#fb923c" : "rgba(169,176,209,0.7)"}
        fontSize={11} fontFamily={typefaces.body}
      >
        {payload.value}{is2023 ? "*" : ""}
      </text>
    );
  };

  return (
    <View style={styles.chartShell}>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(117,130,160,0.15)" vertical={false} />
            <XAxis dataKey="periodYear" tick={<CustomXTick />} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => Number(v).toFixed(1)}
              tick={tickStyle} axisLine={false} tickLine={false} width={36}
            />
            <Tooltip
              formatter={(value: any) =>
                value && value > 0 ? [Number(value).toFixed(2), "Avg countries"] : ["—", "No data"]
              }
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              labelFormatter={(label) => label === 2023 ? `${label} (Oct–Dec only)` : `${label}`}
            />
            <Bar dataKey="avgCountries" shape={<ReachBar />} />
          </BarChart>
        </ResponsiveContainer>
      </View>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendItem}>
          <View style={[styles.chartLegendSwatch, { backgroundColor: "#4ade80", opacity: 0.65 }]} />
          <Text style={styles.chartLegendText}>2017–2021</Text>
        </View>
        <View style={styles.chartLegendItem}>
          <View
            style={[
              styles.chartLegendSwatch,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "#4ade80",
                borderStyle: "dashed" as any,
              },
            ]}
          />
          <Text style={styles.chartLegendText}>2023–2025 (Top 50 only — dimmed)</Text>
        </View>
        <Text style={[styles.chartLegendText, { color: "#fb923c" }]}>
          * 2023 = Oct–Dec only
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chart: Chapter 1 — Discovery Gap Distribution Histogram
// ---------------------------------------------------------------------------

function DiscoveryGapHistogram({ data }: { data: ApiGapBucket[] }) {
  const sorted = [...data].sort((a, b) => a.bucketOrder - b.bucketOrder);
  return (
    <View style={styles.chartShell}>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(117,130,160,0.15)" vertical={false} />
            <XAxis
              dataKey="bucketLabel"
              tick={{ fill: "rgba(169,176,209,0.7)", fontSize: 11, fontFamily: typefaces.body }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              formatter={(value: any) => [Number(value).toLocaleString(), "Songs"]}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Bar dataKey="songCount" fill="#818cf8" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// About This Data (collapsible)
// ---------------------------------------------------------------------------

const ABOUT_ENTRIES = [
  {
    icon: "!",
    iconType: "orange" as const,
    title: "22-month data gap (Dec 2021–Oct 2023)",
    body: "No data exists for this period. Trend lines are broken, not interpolated.",
  },
  {
    icon: "!",
    iconType: "orange" as const,
    title: "2023 data covers Oct 17–Dec 31 only",
    body: "Heavily Q4-weighted. Affects Hidden Gems, Country Profile, and any chart scoped to 2023.",
  },
  {
    icon: "i",
    iconType: "blue" as const,
    title: "2017–2021 and 2023–2025 use different chart depths",
    body: "2017–2021 data draws from the Top 200 chart — 200 songs per country per day. 2023–2025 data draws from the Top 50 chart — 50 songs per country per day. Both are streams-based demand charts, but 2017–2021 has significantly deeper per-country coverage. Cross-period comparisons reflect this difference.",
  },
  {
    icon: "i",
    iconType: "blue" as const,
    title: "Chart scope differs between time periods",
    body: "2017–2021 data draws from Top 200 only. 2023–2025 data draws from Top 50 only. Viral 50 entries are excluded from all calculations. Values are not directly comparable across the gap.",
  },
  {
    icon: "i",
    iconType: "blue" as const,
    title: "How isolation score is calculated",
    body: "Isolation score = the percentage of a country's charting songs that appeared in no other country's charts during the same year. A score of 92% means 92 out of every 100 songs charting in that market stayed completely local.",
  },
];

const ICON_COLORS: Record<string, string> = {
  orange: "#fb923c",
  blue: "#63b3ed",
};

function AboutThisData({ discoveryGap }: { discoveryGap: ApiDiscoveryGap | null }) {
  const [open, setOpen] = useState(false);

  const dynamicEntries = [
    ...ABOUT_ENTRIES,
    {
      icon: "i",
      iconType: "blue" as const,
      title: "Discovery gap reflects first crossings only",
      body: discoveryGap
        ? `Mean (${discoveryGap.avgGapDays}d) and median (${discoveryGap.medianGapDays}d) diverge because crossover is bimodal. Most songs that cross any border do so within two weeks. A long tail of songs that took months — or barely reached a second market — pulls the mean up sharply. Songs that never crossed any border are excluded. Sample size: ${discoveryGap.sampleSize.toLocaleString()} songs.`
        : "Mean and median diverge because crossover is bimodal. Most songs that cross any border do so within two weeks. A long tail pulls the mean up sharply. Songs that never crossed any border are excluded.",
    },
  ];

  return (
    <View style={styles.aboutSection}>
      <Pressable style={styles.aboutToggleRow} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.aboutToggleLabel}>
          About this data — sources, limitations & methodology
        </Text>
        <Text style={styles.aboutChevron}>{open ? "▲" : "▼"}</Text>
      </Pressable>
      {open ? (
        <View style={styles.aboutEntries}>
          {dynamicEntries.map((entry, i) => (
            <View key={i} style={styles.aboutEntry}>
              <View
                style={[
                  styles.aboutIconWrap,
                  { backgroundColor: `${ICON_COLORS[entry.iconType]}22` },
                ]}
              >
                <Text style={[styles.aboutIconText, { color: ICON_COLORS[entry.iconType] }]}>
                  {entry.icon}
                </Text>
              </View>
              <View style={styles.aboutEntryContent}>
                <Text style={styles.aboutEntryTitle}>{entry.title}</Text>
                <Text style={styles.aboutEntryBody}>{entry.body}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen content
// ---------------------------------------------------------------------------

function DashboardScreenContent() {
  const [overlapRate, setOverlapRate] = useState<ApiOverlapRate | null>(null);
  const [discoveryGap, setDiscoveryGap] = useState<ApiDiscoveryGap | null>(null);
  const [isolationLeader, setIsolationLeader] = useState<ApiIsolationLeader | null>(null);
  const [peakReach, setPeakReach] = useState<ApiPeakReach | null>(null);
  const [trendData, setTrendData] = useState<ApiTrendPoint[]>([]);
  const [isolationRanking, setIsolationRanking] = useState<ApiIsolationEntry[]>([]);
  const [dashboardCountries, setDashboardCountries] = useState<Country[]>([]);
  const [gapDistribution, setGapDistribution] = useState<ApiGapBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountrySelectorOption | null>(null);

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
      .then(([rate, gap, leader, reach, trend, ranking, gapDist]) => {
        setOverlapRate(rate);
        setDiscoveryGap(gap);
        setIsolationLeader(leader);
        setPeakReach(reach);
        setTrendData(trend);
        setIsolationRanking(ranking);
        setGapDistribution(gapDist);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : "Failed to load dashboard data");
        setLoading(false);
      });

    loadDashboardCountriesWithAppData()
      .then(setDashboardCountries)
      .catch(() => setDashboardCountries([]));
  }, []);

  // All pull-stat values derived from API data
  const notCrossingPct = useMemo(
    () => (overlapRate ? Math.round(100 - overlapRate.overlapPct) : null),
    [overlapRate]
  );

  const isolationSpread = useMemo(() => {
    if (isolationRanking.length < 2) return null;
    const scores = isolationRanking.map((e) => e.isolationScore);
    return Math.round(Math.max(...scores) - Math.min(...scores));
  }, [isolationRanking]);

  const countryOptions = useMemo<CountrySelectorOption[]>(() => {
    const isolationByCode = new Map(
      isolationRanking.map((entry) => [entry.isoCode.toUpperCase(), entry])
    );

    if (dashboardCountries.length === 0) {
      return isolationRanking.map((entry) => ({
        isoCode: entry.isoCode,
        countryName: entry.countryName,
        isolationScore: entry.isolationScore,
        isolationTier: entry.isolationTier,
      }));
    }

    return dashboardCountries
      .filter(isCountryWithAppData)
      .map((country) => {
        const isolationEntry = isolationByCode.get(country.code.toUpperCase());
        return {
          isoCode: country.code,
          countryName: country.name,
          isolationScore: isolationEntry?.isolationScore ?? null,
          isolationTier: isolationEntry?.isolationTier ?? null,
        };
      })
      .sort((a, b) => a.countryName.localeCompare(b.countryName));
  }, [dashboardCountries, isolationRanking]);

  const overlapChange = useMemo(() => {
    const nonGap = trendData.filter((p) => !p.isGap && p.overlapPct > 0);
    const pt2017 = nonGap.find((p) => p.periodYear === 2017);
    const pt2021 = nonGap.find((p) => p.periodYear === 2021);
    if (!pt2017 || !pt2021) return null;
    return {
      delta: Math.round(Math.abs(pt2021.overlapPct - pt2017.overlapPct)),
      pct2017: Math.round(pt2017.overlapPct),
      pct2021: Math.round(pt2021.overlapPct),
      direction: pt2021.overlapPct >= pt2017.overlapPct ? "rose" : "fell",
    };
  }, [trendData]);

  // Card 3 personalization
  const selectedCountryHasIsolation = selectedCountry?.isolationScore !== null && selectedCountry?.isolationScore !== undefined;
  const isolationCardScore = selectedCountry
    ? selectedCountryHasIsolation
      ? Math.round(selectedCountry.isolationScore as number)
      : null
    : isolationLeader
    ? Math.round(isolationLeader.isolationScore)
    : null;
  const isolationCardName =
    selectedCountry?.countryName ?? isolationLeader?.countryName ?? "";
  const isolationCardTierLabel = selectedCountryHasIsolation
    ? (selectedCountry?.isolationScore as number) > 65
      ? "highly isolated market"
      : (selectedCountry?.isolationScore as number) >= 40
      ? "moderately isolated"
      : "well connected"
    : selectedCountry
    ? "app data available"
    : "most isolated market";
  const isolationCardBarColor = selectedCountryHasIsolation
    ? (selectedCountry?.isolationScore as number) > 65
      ? KPI_BAR.red
      : (selectedCountry?.isolationScore as number) >= 40
      ? "#fb923c"
      : KPI_BAR.green
    : selectedCountry
    ? KPI_BAR.blue
    : KPI_BAR.red;

  // Personalized CTA labels
  const countryLabel = selectedCountry?.countryName ?? null;
  const countryParam = selectedCountry
    ? `?country=${encodeURIComponent(selectedCountry.isoCode)}`
    : "";
  const gemLabel = countryLabel
    ? `Find ${countryLabel}'s hidden gems →`
    : "Find hidden gems →";
  const globeLabel = countryLabel
    ? `See ${countryLabel} on the map →`
    : "Explore these gaps on the map →";
  const missingLabel = countryLabel
    ? `Find what ${countryLabel} is missing →`
    : "Find what your country is missing →";

  // Peak song display date
  const peakDateStr = peakReach?.peakDate
    ? (() => {
        const d = new Date(peakReach.peakDate);
        return `peak ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
      })()
    : null;
  const peakReachArtUrl =
    peakReach?.albumArtUrl ?? getKnownPeakReachArtUrl(peakReach?.songTitle, peakReach?.artistName);

  // Scrollbar state
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
    ? (pageScrollY / (pageContentHeight - pageViewportHeight)) *
      (pageViewportHeight - pageThumbHeight)
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
    if (Platform.OS !== "web" || !isDraggingPageScrollbar || typeof document === "undefined")
      return;
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
  }, [
    isDraggingPageScrollbar,
    pageHasOverflow,
    pageThumbHeight,
    pageTrackHeight,
    pageContentHeight,
    pageViewportHeight,
  ]);

  if (loading || fetchError) {
    return (
      <ScreenScaffold>
        <View style={styles.pageScrollFrame}>
          <View style={styles.statusShell}>
            <Text style={[styles.statusText, fetchError ? styles.statusError : null]}>
              {fetchError ?? "Loading…"}
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
          {/* ── Hero ── */}
          <View style={styles.heroWrap}>
            <LinearGradient
              colors={HERO_GRADIENT}
              locations={HERO_GRADIENT_LOCATIONS}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.contentInner}>
              <View style={styles.heroContent}>
                <Text style={styles.heroOverline}>The discovery gap — a data story</Text>
                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroH1}>
                    {"Most music never leaves "}
                    <Text style={styles.heroH1Accent}>home.</Text>
                  </Text>
                  <GemIcon size={30} style={styles.heroGemIcon} />
                </View>
                <Text style={styles.heroBody}>
                  A song can be charting in 30 countries and completely unknown in yours.
                  This isn't a taste difference — it's a structural gap in how music travels.
                </Text>
                <CountrySelector
                  data={countryOptions}
                  selectedCountry={selectedCountry}
                  onSelect={setSelectedCountry}
                  onClear={() => setSelectedCountry(null)}
                />
                <View style={styles.scrollHint}>
                  <View style={styles.scrollHintLine} />
                  <Text style={styles.scrollHintText}>scroll to explore</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ══ Chapter 1: The gap exists (base dark) ══ */}
          <View style={styles.chapterWrap}>
            <View style={styles.contentInner}>
              <ChapterLabel num={1} title="THE GAP EXISTS" />
              <View style={styles.chapterTwoCol}>
                <View style={styles.chapterLeft}>
                  {notCrossingPct !== null ? (
                    <PullStat
                      number={String(notCrossingPct)}
                      unit="%"
                      context="of all charting songs never appeared in a second country's charts."
                    />
                  ) : null}
                </View>
                <View style={styles.chapterRight}>
                  {notCrossingPct !== null && overlapRate ? (
                    <ArgumentText>
                      Out of every 100 songs that charted anywhere in the world between
                      2017 and 2025,{" "}
                      <Text style={styles.argBold}>{notCrossingPct} stayed home.</Text> They
                      charted, they disappeared, and no other market ever heard of them. The
                      remaining{" "}
                      <Text style={styles.argBold}>
                        {Math.round(overlapRate.overlapPct)} crossed at least one border
                      </Text>{" "}
                      — and a handful crossed dozens.
                    </ArgumentText>
                  ) : null}
                  <CtaRow>
                    <CtaButton
                      label={globeLabel}
                      primary
                      onPress={() => navigateTo(`/discovery${countryParam}`)}
                    />
                    <CtaButton
                      label={gemLabel}
                      onPress={() => navigateTo(`/hidden-gems${countryParam}`)}
                    />
                  </CtaRow>
                </View>
              </View>

              {/* Discovery Gap Distribution histogram */}
              {gapDistribution.length > 0 ? (
                <>
                  <ChapterCard label="DISCOVERY GAP DISTRIBUTION">
                    <DiscoveryGapHistogram data={gapDistribution} />
                  </ChapterCard>
                  <Text style={[styles.pullQuote, styles.histogramPullQuote]}>
                    Most songs that cross any border do so within two weeks. The long tail —
                    songs that took months or never arrived at all — is what the discovery gap
                    is made of.
                  </Text>
                </>
              ) : null}

              {/* KPI flip cards — full-width 4-column grid */}
              <View style={styles.kpiGrid}>
                {overlapRate ? (
                  <KpiCard
                    barColor={KPI_BAR.purple}
                    front={
                      <View style={styles.kpiFront}>
                        <Text style={styles.kpiLabel}>Global Overlap Rate</Text>
                        <Text style={styles.kpiNumber}>{Math.round(overlapRate.overlapPct)}%</Text>
                        <Text style={styles.kpiSublabel}>songs reached 2+ countries</Text>
                      </View>
                    }
                    back={
                      <View style={styles.kpiBack}>
                        <Text style={styles.kpiBackTitle}>What this means</Text>
                        <Text style={styles.kpiBackBody}>
                          {Math.round(100 - overlapRate.overlapPct)}% of charting music stayed in
                          exactly one country. The {Math.round(overlapRate.overlapPct)}% that
                          crossed is what this app is built to help you find.
                        </Text>
                        <Pressable onPress={() => navigateTo("/discovery")}>
                          <Text style={styles.kpiCta}>Explore map →</Text>
                        </Pressable>
                      </View>
                    }
                  />
                ) : null}

                {discoveryGap ? (
                  <KpiCard
                    barColor={KPI_BAR.blue}
                    front={
                      <View style={styles.kpiFront}>
                        <Text style={styles.kpiLabel}>Discovery Gap</Text>
                        <Text style={styles.kpiNumber}>{discoveryGap.medianGapDays}d</Text>
                        <Text style={styles.kpiSublabel}>median to cross a border</Text>
                        <Text style={styles.kpiSecondary}>
                          mean: {discoveryGap.avgGapDays} days
                        </Text>
                      </View>
                    }
                    back={
                      <View style={styles.kpiBack}>
                        <Text style={styles.kpiBackTitle}>Why two numbers?</Text>
                        <Text style={styles.kpiBackBody}>
                          Most crossovers happen within days. A long tail of slow-movers pulls
                          the mean to {discoveryGap.avgGapDays}. The median is the real signal.
                        </Text>
                      </View>
                    }
                  />
                ) : null}

                {selectedCountry || isolationCardScore !== null ? (
                  <KpiCard
                    barColor={isolationCardBarColor}
                    front={
                      <View style={styles.kpiFront}>
                        <Text style={styles.kpiLabel}>
                          {selectedCountry ? "Your Country" : "Most Isolated Market"}
                        </Text>
                        <Text style={styles.kpiNumber}>
                          {isolationCardScore !== null ? `${isolationCardScore}%` : "—"}
                        </Text>
                        <Text style={styles.kpiSublabel}>
                          {isolationCardName} — {isolationCardTierLabel}
                        </Text>
                      </View>
                    }
                    back={
                      <View style={styles.kpiBack}>
                        <Text style={styles.kpiBackTitle}>
                          {selectedCountry ? "Your country in context" : "Isolation explained"}
                        </Text>
                        <Text style={styles.kpiBackBody}>
                          {selectedCountry
                            ? selectedCountry.isolationScore === null
                              ? `${selectedCountry.countryName} is available in the app data, but the current isolation ranking response does not include a score for it.`
                              : selectedCountry.isolationScore > 65
                              ? `${selectedCountry.countryName} has an isolation score of ${Math.round(selectedCountry.isolationScore)}%. Most of its chart stays local — it has some of the most to discover.`
                              : selectedCountry.isolationScore >= 40
                              ? `${selectedCountry.countryName} has an isolation score of ${Math.round(selectedCountry.isolationScore)}%. Some global crossover, but still plenty of undiscovered music.`
                              : `${selectedCountry.countryName} has an isolation score of ${Math.round(selectedCountry.isolationScore)}%. Its charts overlap heavily with global trends.`
                            : isolationLeader
                            ? `${Math.round(isolationLeader.isolationScore)}% of songs charting in ${isolationLeader.countryName} appeared nowhere else. These are the markets with the most to discover.`
                            : ""}
                        </Text>
                        <Pressable onPress={() => navigateTo(`/hidden-gems${countryParam}`)}>
                          <Text style={styles.kpiCta}>{gemLabel}</Text>
                        </Pressable>
                      </View>
                    }
                  />
                ) : null}

                {peakReach ? (
                  <KpiCard
                    barColor={KPI_BAR.green}
                    front={
                      <View style={styles.kpiFront}>
                        <Text style={styles.kpiLabel}>Peak Cross-Regional Reach</Text>
                        <Text style={styles.kpiNumber}>{peakReach.peakCountryCount}</Text>
                        <Text style={styles.kpiSublabel}>countries at once — peak reach</Text>
                      </View>
                    }
                    back={
                      <View style={styles.kpiBack}>
                        <Text style={styles.kpiBackTitle}>The ceiling</Text>
                        <Text style={styles.kpiBackBody}>
                          {peakReach.songTitle} by {peakReach.artistName} charted in{" "}
                          {peakReach.peakCountryCount} countries simultaneously. The average
                          song reaches 3.
                        </Text>
                        <Pressable onPress={() => navigateTo("/discovery")}>
                          <Text style={styles.kpiCta}>Explore map →</Text>
                        </Pressable>
                      </View>
                    }
                  />
                ) : null}
              </View>
            </View>
          </View>

          {/* ══ Chapter 2: The gap is geographic (elevated) ══ */}
          <View style={[styles.chapterWrap, styles.chapterElevated]}>
            <View style={styles.contentInner}>
              <ChapterLabel num={2} title="THE GAP IS GEOGRAPHIC" />
              <View style={styles.chapterTwoCol}>
                <View style={styles.chapterLeft}>
                  {isolationSpread !== null ? (
                    <PullStat
                      number={String(isolationSpread)}
                      unit="pts"
                      context="difference between the most and least isolated market in this dataset."
                    />
                  ) : null}
                  <Text style={styles.isolationExplainer}>
                    Isolation score = % of a country's charting songs that appeared nowhere else
                    in the world.
                  </Text>
                </View>
                <View style={styles.chapterRight}>
                  <ArgumentText>
                    The gap isn't evenly distributed. Some markets are deeply wired into global
                    trends. Others are almost entirely self-contained.{" "}
                    <Text style={styles.argBold}>
                      Where your country falls determines how much music you're missing.
                    </Text>
                  </ArgumentText>
                  <CtaRow>
                    <CtaButton
                      label={
                        countryLabel
                          ? `See ${countryLabel} on the map →`
                          : "See this on the map →"
                      }
                      primary
                      onPress={() => navigateTo(`/discovery${countryParam}`)}
                    />
                    <CtaButton
                      label="Compare two countries →"
                      onPress={() => navigateTo("/compare")}
                    />
                  </CtaRow>
                </View>
              </View>
              {isolationRanking.length > 0 ? (
                <ChapterCard label="ISOLATION SCORES BY COUNTRY">
                  <IsolationBarChart
                    data={isolationRanking}
                    selectedCountry={selectedCountry}
                  />
                </ChapterCard>
              ) : null}
            </View>
          </View>

          {/* ══ Chapter 3: Measurable over time (base dark) ══ */}
          <View style={styles.chapterWrap}>
            <View style={styles.contentInner}>
              <ChapterLabel num={3} title="THE GAP IS MEASURABLE OVER TIME" />
              <View style={styles.chapterTwoCol}>
                <View style={styles.chapterLeft}>
                  {overlapChange !== null ? (
                    <PullStat
                      number={`${overlapChange.direction === "rose" ? "+" : "-"}${overlapChange.delta}`}
                      unit="pts"
                      context={`overlap ${overlapChange.direction} from ${overlapChange.pct2017}% to ${overlapChange.pct2021}% between 2017 and 2021.`}
                    />
                  ) : null}
                </View>
                <View style={styles.chapterRight}>
                  <ArgumentText>
                    Global overlap was{" "}
                    <Text style={styles.argBold}>improving through 2021.</Text> Then the data
                    stops. When it resumes in late 2023, the picture looks different —{" "}
                    <Text style={styles.argBold}>but that may be the data, not reality.</Text>
                  </ArgumentText>
                  <View style={styles.warningTagRow}>
                    <WarningTag
                      type="orange"
                      label="⚠ 22-month gap — broken, not interpolated"
                    />
                    <WarningTag
                      type="blue"
                      label="i 2017–2021 data vs 2023–2025 data uses different chart pools"
                    />
                  </View>
                </View>
              </View>
              {trendData.length > 0 ? (
                <>
                  <ChapterCard label="GLOBAL OVERLAP RATE — 2017–2025">
                    <OverlapTrendChart data={trendData} />
                  </ChapterCard>
                  <Text style={styles.pullQuote}>
                    The dashed bars use a smaller chart pool. A visual dip after the gap
                    doesn't mean music borders got worse — it partly means we're counting
                    fewer songs per country.
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          {/* ══ Chapter 4: The ceiling (elevated) ══ */}
          <View style={[styles.chapterWrap, styles.chapterElevated]}>
            <View style={styles.contentInner}>
              <ChapterLabel num={4} title="THE CEILING" />
              <View style={styles.chapterTwoCol}>
                <View style={styles.chapterLeft}>
                  {peakReach ? (
                    <PullStat
                      number={String(peakReach.peakCountryCount)}
                      context="countries at once. The most connected a song has ever been in this dataset."
                    />
                  ) : null}
                </View>
                <View style={styles.chapterRight}>
                  {peakReach ? (
                    <>
                      <ArgumentText>
                        The average charting song reaches{" "}
                        <Text style={styles.argBold}>3 countries.</Text> The record is{" "}
                        {peakReach.peakCountryCount}. Between those two numbers is{" "}
                        <Text style={styles.argBold}>
                          every song trending somewhere right now that hasn't reached you yet.
                        </Text>
                      </ArgumentText>
                      <View style={styles.songRefCard}>
                        <CdCaseArt
                          size={74}
                          placeholderColor={rowBackdropColors[0]}
                          artImageUrl={peakReachArtUrl}
                          loading={!peakReachArtUrl}
                        />
                        <View style={styles.songRefInfo}>
                          <Text style={styles.songRefTitle}>{peakReach.songTitle}</Text>
                          <Text style={styles.songRefArtist}>
                            {peakReach.artistName}
                            {peakDateStr ? ` · ${peakDateStr}` : ""}
                          </Text>
                        </View>
                        <View style={styles.songRefCount}>
                          <Text style={styles.songRefNumber}>{peakReach.peakCountryCount}</Text>
                          <Text style={styles.songRefCountLabel}>countries at once</Text>
                        </View>
                      </View>
                      <View style={styles.warningTagRow}>
                        <WarningTag type="orange" label="⚠ 2023 = Oct–Dec only" />
                        <WarningTag type="blue" label="i 2023–2025 uses Top 50 charts only" />
                      </View>
                      <CtaRow>
                        <CtaButton
                          label={missingLabel}
                          primary
                          onPress={() => navigateTo(`/hidden-gems${countryParam}`)}
                        />
                        <CtaButton
                          label="Explore on the map →"
                          onPress={() => navigateTo("/discovery")}
                        />
                      </CtaRow>
                    </>
                  ) : null}
                </View>
              </View>
              {trendData.length > 0 ? (
                <ChapterCard label="AVERAGE COUNTRIES PER SONG — 2017–2025">
                  <GlobalReachChart data={trendData} />
                </ChapterCard>
              ) : null}
            </View>
          </View>

          {/* ══ Conclusion ══ */}
          <View style={styles.conclusionWrap}>
            <LinearGradient
              colors={HERO_GRADIENT}
              locations={HERO_GRADIENT_LOCATIONS}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.contentInner}>
              <View style={styles.conclusionTwoCol}>
                <View style={styles.conclusionLeft}>
                  <Text style={styles.conclusionHeadline}>
                    {"The gap is real. The music is "}
                    <Text style={styles.conclusionAccent}>out there.</Text>
                  </Text>
                  <Text style={styles.conclusionBody}>
                    {notCrossingPct !== null ? `${notCrossingPct}%` : "—"} of charting songs
                    never crossed a single border. The ones that did spread fast — most within
                    days. A handful reached{" "}
                    {peakReach ? peakReach.peakCountryCount : "—"} countries at once.
                    Everything in between is waiting to be discovered.
                  </Text>
                  <View style={styles.conclusionCtas}>
                    <CtaButton
                      label={missingLabel}
                      primary
                      onPress={() => navigateTo(`/hidden-gems${countryParam}`)}
                    />
                    <CtaButton
                      label="Explore on the map →"
                      onPress={() => navigateTo("/discovery")}
                    />
                  </View>
                </View>
                <View style={styles.conclusionRight}>
                  <View style={styles.statGrid}>
                    <View style={styles.statCard}>
                      <Text style={styles.statNumber}>
                        {notCrossingPct !== null ? `${notCrossingPct}%` : "—"}
                      </Text>
                      <Text style={styles.statLabel}>
                        of music never leaves its home market
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statNumber}>
                        {discoveryGap ? `${discoveryGap.medianGapDays}d` : "—"}
                      </Text>
                      <Text style={styles.statLabel}>median time to cross a border</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statNumber}>
                        {peakReach ? peakReach.peakCountryCount : "—"}
                      </Text>
                      <Text style={styles.statLabel}>
                        countries — the ceiling one song ever reached
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statNumber}>
                        {isolationLeader
                          ? `${Math.round(isolationLeader.isolationScore)}%`
                          : "—"}
                      </Text>
                      <Text style={styles.statLabel}>
                        isolation — the most self-contained market
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── About This Data ── */}
          <View style={styles.contentInner}>
            <AboutThisData discoveryGap={discoveryGap} />
          </View>
        </ScrollView>

        {pageScrollbarVisible ? (
          <View
            ref={pageTrackRef}
            style={styles.pageScrollbarTrack}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) =>
              scrollPageToTrackLocation(event.nativeEvent.locationY)
            }
            onResponderMove={(event) =>
              scrollPageToTrackLocation(event.nativeEvent.locationY)
            }
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
      ? ({ overflowY: "scroll", scrollbarWidth: "none" } as ViewStyle)
      : null),
  },
  scrollContent: {
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

  // —— Max-width content inner ——
  contentInner: {
    maxWidth: 960,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 28,
  },

  // —— Hero ——
  heroWrap: {
    overflow: "hidden",
    paddingTop: 72,
    paddingBottom: 60,
  },
  heroContent: {
    alignItems: "center",
    gap: 20,
  },
  heroOverline: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase" as any,
    opacity: 0.35,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  heroH1: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
    lineHeight: 48,
  },
  heroH1Accent: {
    color: colors.accent,
  },
  heroGemIcon: {
    opacity: 0.8,
  },
  heroBody: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.65,
    maxWidth: 500,
    textAlign: "center",
  },
  scrollHint: {
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    opacity: 0.3,
  },
  scrollHintLine: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  scrollHintText: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 11,
  },

  // —— Country selector ——
  countrySelectorWrap: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
    gap: 8,
  },
  countrySelectorPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: "rgba(117,82,107,0.5)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  countrySelectorText: {
    flex: 1,
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
  },
  countrySelectorChevron: {
    color: colors.text,
    fontSize: 11,
    opacity: 0.6,
  },
  countryDropdown: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(117,82,107,0.3)",
    backgroundColor: colors.backgroundRaised,
    maxHeight: 200,
    overflow: "hidden",
  },
  countryDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(117,130,160,0.1)",
  },
  countryDropdownItemSelected: {
    backgroundColor: "rgba(117,82,107,0.15)",
  },
  countryDropdownName: {
    flex: 1,
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 13,
  },
  countryDropdownScore: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 12,
    fontWeight: "600",
  },
  countryDropdownMeta: {
    alignItems: "flex-end",
    gap: 1,
  },
  countryDropdownCaption: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 9,
    opacity: 0.45,
  },
  countryBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(117,82,107,0.4)",
    backgroundColor: "rgba(117,82,107,0.08)",
    gap: 10,
  },
  countryBannerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  countryBannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 5,
  },
  countryBannerText: {
    flex: 1,
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 19,
  },
  countryBannerName: {
    color: colors.accent,
    fontWeight: "500",
  },
  countryBannerClear: {
    paddingLeft: 8,
  },
  countryBannerClearText: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 12,
    opacity: 0.6,
  },

  // —— Chapter ——
  chapterWrap: {
    paddingVertical: 56,
  },
  chapterElevated: {
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  chapterLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 52,
  },
  chapterCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "rgba(117,82,107,0.6)",
    backgroundColor: "rgba(117,82,107,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumber: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 18,
    fontWeight: "700",
  },
  chapterTitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 18,
    letterSpacing: 2.4,
    textTransform: "uppercase" as any,
    fontWeight: "500",
    opacity: 0.75,
  },

  // —— Two-column layout ——
  chapterTwoCol: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 28,
    marginBottom: 32,
    alignItems: "flex-start",
  },
  chapterLeft: {
    minWidth: 180,
    maxWidth: 220,
    flex: 0,
  },
  chapterRight: {
    flex: 1,
    minWidth: 260,
    gap: 16,
  },

  // —— Pull stat (poster-scale typography) ——
  pullStat: {
    gap: 8,
  },
  pullStatDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "nowrap",
  },
  pullStatNumber: {
    color: colors.accent,
    fontFamily: typefaces.display,
    fontSize: 108,
    fontWeight: "700",
    letterSpacing: -4,
    lineHeight: 108,
  },
  pullStatUnit: {
    color: colors.accent,
    fontFamily: typefaces.display,
    fontSize: 64,
    fontWeight: "700",
    letterSpacing: -2,
    lineHeight: 72,
    marginLeft: 2,
  },
  pullStatContext: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 220,
    opacity: 0.45,
    marginTop: 4,
  },
  isolationExplainer: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 220,
    opacity: 0.5,
    marginTop: 20,
    fontStyle: "italic",
  },

  // —— Argument text ——
  argument: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 28,
  },
  argBold: {
    color: colors.textStrong,
    fontWeight: "500",
  },

  // —— CTA row ——
  ctaRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  ctaButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
  ctaButtonPrimary: {
    borderColor: "rgba(117,82,107,0.6)",
    backgroundColor: "rgba(117,82,107,0.12)",
  },
  ctaButtonSecondary: {
    borderColor: "rgba(117,130,160,0.25)",
    backgroundColor: "transparent",
  },
  ctaButtonHovered: {
    backgroundColor: "rgba(117,82,107,0.08)",
  },
  ctaButtonText: {
    fontFamily: typefaces.body,
    fontSize: 13,
    fontWeight: "500",
  },
  ctaButtonTextPrimary: {
    color: colors.accent,
  },
  ctaButtonTextSecondary: {
    color: colors.text,
    opacity: 0.75,
  },

  // —— Warning tags ——
  warningTagRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  warningTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  warningTagOrange: {
    backgroundColor: "rgba(251,146,60,0.12)",
    borderColor: "rgba(251,146,60,0.35)",
  },
  warningTagBlue: {
    backgroundColor: "rgba(99,179,237,0.12)",
    borderColor: "rgba(99,179,237,0.35)",
  },
  warningTagText: {
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 15,
  },

  // —— Chapter card (chart wrapper) ——
  chapterCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  chapterCardLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase" as any,
    opacity: 0.25,
  },

  // —— Pull quote (after trend chart) ——
  pullQuote: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    opacity: 0.35,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(117,82,107,0.25)",
    paddingLeft: 12,
    marginTop: 12,
  },
  histogramPullQuote: {
    marginBottom: 12,
  },

  // —— KPI flip cards ——
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    flexBasis: "45%",
    minWidth: 300,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    minHeight: 140,
    overflow: "hidden",
    cursor: "pointer" as any,
  },
  kpiCardFlipped: {
    backgroundColor: "rgba(117,82,107,0.08)",
    borderColor: "rgba(117,82,107,0.25)",
  },
  kpiAccentBar: {
    width: 3,
    alignSelf: "stretch",
  },
  kpiContent: {
    flex: 1,
    padding: 16,
  },
  kpiFrontShell: {
    flex: 1,
    justifyContent: "space-between",
    gap: 12,
  },
  kpiFront: {
    gap: 6,
  },
  kpiBack: {
    gap: 8,
  },
  kpiLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    opacity: 0.6,
  },
  kpiNumber: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 42,
  },
  kpiSublabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  kpiSecondary: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 12,
    opacity: 0.5,
  },
  kpiFlipHint: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 10,
    opacity: 0.35,
    textAlign: "right",
    marginTop: 6,
  },
  kpiBackTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 15,
    fontWeight: "600",
  },
  kpiBackBody: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.75,
  },
  kpiCta: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 12,
    fontWeight: "500",
  },

  // —— Song reference card (Chapter 4) ——
  songRefCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  songRefSwatch: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  songRefInfo: {
    flex: 1,
    gap: 2,
  },
  songRefTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 13,
    fontWeight: "500",
  },
  songRefArtist: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 11,
    opacity: 0.7,
  },
  songRefCount: {
    alignItems: "flex-end",
    gap: 1,
  },
  songRefNumber: {
    color: colors.accent,
    fontFamily: typefaces.display,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 26,
  },
  songRefCountLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 10,
    opacity: 0.6,
  },

  // —— Chart shared ——
  chartShell: {
    gap: 10,
  },
  chartContainer: {
    height: 220,
  },
  chartLegendRow: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
    paddingTop: 4,
    alignItems: "center",
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
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.6,
  },

  // —— Isolation chart ——
  isolationChartShell: {
    gap: 8,
  },
  isolationScrollContainer: {
    maxHeight: 400,
    overflow: "hidden",
  },

  // —— Conclusion ——
  conclusionWrap: {
    overflow: "hidden",
    paddingVertical: 64,
  },
  conclusionTwoCol: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 48,
    alignItems: "flex-start",
  },
  conclusionLeft: {
    flex: 1,
    minWidth: 260,
    gap: 20,
  },
  conclusionRight: {
    width: 444,
    minWidth: 444,
    maxWidth: "100%",
    flex: 0,
  },
  conclusionHeadline: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  conclusionAccent: {
    color: colors.accent,
  },
  conclusionBody: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.75,
  },
  conclusionCtas: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },

  // —— Stat grid (conclusion) ——
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  statCard: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 216,
    width: 216,
    aspectRatio: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 17,
    gap: 6,
  },
  statNumber: {
    color: colors.accent,
    fontFamily: typefaces.display,
    fontSize: 46,
    fontWeight: "700",
    lineHeight: 50,
  },
  statLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 20,
    opacity: 0.65,
  },

  // —— About This Data ——
  aboutSection: {
    paddingTop: 24,
    paddingBottom: 48,
    gap: 4,
  },
  aboutToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    cursor: "pointer" as any,
  },
  aboutToggleLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    opacity: 0.75,
  },
  aboutChevron: {
    color: colors.text,
    fontSize: 11,
    opacity: 0.5,
  },
  aboutEntries: {
    gap: 0,
    marginTop: 8,
  },
  aboutEntry: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(117,130,160,0.12)",
    alignItems: "flex-start",
  },
  aboutIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  aboutIconText: {
    fontFamily: typefaces.body,
    fontSize: 11,
    fontWeight: "700",
  },
  aboutEntryContent: {
    flex: 1,
    gap: 3,
  },
  aboutEntryTitle: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  aboutEntryBody: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },

  // —— Loading / error ——
  statusShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  statusError: {
    color: "#f87171",
  },
});
