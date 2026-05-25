import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CdCaseArt } from "../components/CdCaseArt";
import { GemIcon } from "../components/GemIcon";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { loadAvailableYears } from "../data/countryApi";
import { isCountryWithAppData } from "../data/countryDisplay";
import { useLoadingText } from "../hooks/useLoadingText";
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
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import type {
  ApiDiscoveryGap,
  ApiGapBucket,
  ApiIsolationEntry,
  ApiIsolationLeader,
  ApiOverlapRate,
  ApiPeakReach,
  ApiTrendPoint,
} from "../types/api";
import { Country } from "../types/content";

export type Props = {
  year?: number;
  metrics?: Array<{ label: string; value: string; detail: string }>;
  countries?: Country[];
  onOpenDiscovery?: (countryCode?: string) => void;
  onOpenHiddenGems?: (countryCode?: string) => void;
  onOpenComparison?: () => void;
};

type CountrySelectorOption = {
  isoCode: string;
  countryName: string;
  isolationScore: number | null;
  isolationTier: "high" | "mid" | "low" | null;
};

type VerticalBarDatum = {
  label: string;
  value: number;
  valueLabel: string;
  isGap?: boolean;
  isDimmed?: boolean;
};

const rowBackdropColors = ["#B86A72", "#8B9BC0", "#8B5E7A", "#627F8A", "#C28C5E", "#7A7EB0"];
const heroGradient = ["#1a0a2e", "#0f0e17", "#1a1030"] as const;
const globalAverageIsolation = 56;

const kpiBar = {
  purple: colors.accent,
  blue: "#63b3ed",
  red: "#f87171",
  green: "#4ade80",
};

const isolationColors: Record<"high" | "mid" | "low", readonly [string, string]> = {
  high: ["#f87171", "#B86A72"],
  mid: ["#fb923c", "#C28C5E"],
  low: ["#4ade80", "#627F8A"],
};

const knownPeakReachArt: Record<string, string> = {
  "stay (with justin bieber)|the kid laroi":
    "https://coverartarchive.org/release/9edb549d-b9cd-47b8-8b33-523b0bf8e301/front-500",
};

const aboutEntries = [
  {
    icon: "!",
    iconType: "orange" as const,
    title: "22-month data gap (Dec 2021-Oct 2023)",
    body: "No data exists for this period. Trend lines are broken, not interpolated.",
  },
  {
    icon: "!",
    iconType: "orange" as const,
    title: "2023 data covers Oct 17-Dec 31 only",
    body: "Heavily Q4-weighted. Affects Hidden Gems, Country Profile, and any chart scoped to 2023.",
  },
  {
    icon: "i",
    iconType: "blue" as const,
    title: "2017-2021 and 2023-2025 use different chart depths",
    body: "2017-2021 data draws from the Top 200 chart. 2023-2025 data draws from the Top 50 chart. Both are streams-based demand charts, but 2017-2021 has deeper per-country coverage.",
  },
  {
    icon: "i",
    iconType: "blue" as const,
    title: "Chart scope differs between time periods",
    body: "Viral 50 entries are excluded from all calculations. Values are not directly comparable across the data gap.",
  },
  {
    icon: "i",
    iconType: "blue" as const,
    title: "How isolation score is calculated",
    body: "Isolation score = the percentage of a country's charting songs that appeared in no other country's charts during the same year.",
  },
];

const iconColors = {
  orange: "#fb923c",
  blue: "#63b3ed",
};

function getKnownPeakReachArtUrl(songTitle?: string | null, artistName?: string | null) {
  const key = `${songTitle ?? ""}|${artistName ?? ""}`.trim().toLowerCase();
  return knownPeakReachArt[key];
}

async function loadDashboardCountriesWithAppData(fallbackCountries: Country[] = []) {
  const years = await loadAvailableYears().catch(() => [2025]);
  const countrySets = await Promise.all(
    years.map((year) => loadDiscoveryCountries(year, fallbackCountries).catch(() => []))
  );
  const countriesByCode = new Map<string, Country>();

  countrySets.flat().forEach((country) => {
    if (!isCountryWithAppData(country)) {
      return;
    }

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
    if (entry.isolationScore === null) {
      return null;
    }
    if (entry.isolationScore > 65) {
      return "highly isolated - most of your charts stay local";
    }
    if (entry.isolationScore >= 40) {
      return "moderately isolated - some crossover, a lot still stays home";
    }
    return "well connected - your market overlaps heavily with global trends";
  };

  const rank = selectedCountry
    ? data
        .filter((entry) => entry.isolationScore !== null)
        .findIndex((entry) => entry.isoCode === selectedCountry.isoCode) + 1
    : null;
  const selectedTierLabel = selectedCountry ? tierLabel(selectedCountry) : null;

  return (
    <View style={styles.countrySelectorWrap}>
      <Pressable
        style={({ pressed }) => [
          styles.countrySelectorPill,
          pressed ? styles.pressablePressed : null,
        ]}
        onPress={() => setIsOpen((current) => !current)}
      >
        <Text style={styles.countrySelectorText}>
          {selectedCountry ? `Viewing: ${selectedCountry.countryName}` : "See where your country fits in"}
        </Text>
        <Text style={styles.countrySelectorChevron}>{isOpen ? "▲" : "▼"}</Text>
      </Pressable>

      {isOpen ? (
        <ScrollView style={styles.countryDropdown} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {data.map((entry) => (
            <Pressable
              key={entry.isoCode}
              style={({ pressed }) => [
                styles.countryDropdownItem,
                selectedCountry?.isoCode === entry.isoCode ? styles.countryDropdownItemSelected : null,
                pressed ? styles.pressablePressed : null,
              ]}
              onPress={() => {
                onSelect(entry);
                setIsOpen(false);
              }}
            >
              <Text style={styles.countryDropdownName}>{entry.countryName}</Text>
              {entry.isolationScore !== null ? (
                <View style={styles.countryDropdownMeta}>
                  <Text style={styles.countryDropdownScore}>{Math.round(entry.isolationScore)}%</Text>
                  <Text style={styles.countryDropdownCaption}>isolation score</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
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
                  <Text style={styles.countryBannerName}>{Math.round(selectedCountry.isolationScore)}%</Text>
                  {" - "}
                  {selectedTierLabel}.
                  {rank
                    ? ` It's ranked #${rank} of ${data.filter((entry) => entry.isolationScore !== null).length} countries in the current isolation ranking.`
                    : ""}
                </>
              ) : (
                " is available in the app data. Isolation ranking data was not returned for this country."
              )}
            </Text>
          </View>
          <Pressable style={({ pressed }) => [styles.countryBannerClear, pressed ? styles.pressablePressed : null]} onPress={onClear}>
            <Text style={styles.countryBannerClearText}>x clear</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

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

function PullStat({ number, unit, context }: { number: string; unit?: string; context: string }) {
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

function CtaButton({ label, primary, onPress }: { label: string; primary?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ctaButton,
        primary ? styles.ctaButtonPrimary : styles.ctaButtonSecondary,
        pressed ? styles.ctaButtonPressed : null,
      ]}
    >
      {primary ? (
        <LinearGradient
          colors={["rgba(117,82,107,0.36)", "rgba(108,119,142,0.2)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      <Text style={[styles.ctaButtonText, primary ? styles.ctaButtonTextPrimary : styles.ctaButtonTextSecondary]}>
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
    <View style={[styles.warningTag, type === "orange" ? styles.warningTagOrange : styles.warningTagBlue]}>
      <Text style={[styles.warningTagText, { color: type === "orange" ? "#fb923c" : "#63b3ed" }]}>
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

function KpiCard({ barColor, front, back }: { barColor: string; front: ReactNode; back: ReactNode }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.kpiCard,
        flipped ? styles.kpiCardFlipped : null,
        pressed ? styles.pressablePressed : null,
      ]}
      onPress={() => setFlipped((current) => !current)}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.055)", "rgba(117,82,107,0.075)", "rgba(108,119,142,0.055)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.kpiAccentBar, { backgroundColor: barColor }]} />
      <View style={styles.kpiContent}>
        {flipped ? (
          back
        ) : (
          <View style={styles.kpiFrontShell}>
            {front}
            <Text style={styles.kpiFlipHint}>tap to flip</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function VerticalBarChart({
  data,
  colors: gradientColors,
  maxValue,
  suffix = "",
}: {
  data: VerticalBarDatum[];
  colors: readonly [string, string];
  maxValue?: number;
  suffix?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const computedMax = Math.max(maxValue ?? 0, ...data.map((item) => item.value), 1);
  const selected = selectedIndex === null ? null : data[selectedIndex];

  return (
    <View style={styles.chartShell}>
      <View style={styles.verticalChart}>
        {data.map((item, index) => {
          const height = item.isGap ? 100 : Math.max(8, (item.value / computedMax) * 140);
          return (
            <Pressable
              key={`${item.label}-${index}`}
              style={styles.verticalBarSlot}
              onPress={() => setSelectedIndex((current) => (current === index ? null : index))}
            >
              <View style={styles.verticalBarValueWrap}>
                {item.isGap ? (
                  <View style={styles.gapMarker}>
                    <View style={styles.gapLine} />
                    <Text style={styles.gapLabel}>gap</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.verticalBarOuter,
                      {
                        height,
                        opacity: item.isDimmed ? 0.48 : 1,
                        borderStyle: item.isDimmed ? "dashed" : "solid",
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={gradientColors}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.verticalBarFill}
                    />
                  </View>
                )}
              </View>
              <Text style={[styles.verticalBarLabel, item.isGap ? styles.gapText : null]} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.chartValuePanel}>
        <Text style={styles.chartValueText}>
          {selected ? `${selected.label}: ${selected.valueLabel}${suffix}` : "Tap a bar to view its value."}
        </Text>
      </View>
    </View>
  );
}

function HorizontalIsolationChart({
  data,
  selectedCountry,
}: {
  data: ApiIsolationEntry[];
  selectedCountry: CountrySelectorOption | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const chartData = data.slice(0, 20);
  const tapped = selectedIndex === null ? null : chartData[selectedIndex];

  return (
    <View style={styles.horizontalChartShell}>
      <View style={styles.averageMarkerRow}>
        <Text style={styles.averageMarkerText}>global avg {globalAverageIsolation}%</Text>
      </View>
      {chartData.map((entry, index) => {
        const tier = entry.isolationTier ?? "mid";
        const isSelectedCountry = selectedCountry?.isoCode === entry.isoCode;
        const width = `${Math.max(6, Math.min(100, entry.isolationScore))}%` as const;
        return (
          <Pressable
            key={entry.isoCode}
            style={({ pressed }) => [
              styles.horizontalBarRow,
              isSelectedCountry ? styles.horizontalBarRowSelected : null,
              pressed ? styles.pressablePressed : null,
            ]}
            onPress={() => setSelectedIndex((current) => (current === index ? null : index))}
          >
            <View style={styles.horizontalBarLabelWrap}>
              <Text style={[styles.horizontalBarCountry, isSelectedCountry ? styles.selectedText : null]} numberOfLines={1}>
                {entry.countryName}
              </Text>
              {isSelectedCountry ? <Text style={styles.youBadge}>you</Text> : null}
            </View>
            <View style={styles.horizontalBarTrack}>
              <View style={styles.averageMarker} />
              <View style={[styles.horizontalBarFillWrap, { width }]}>
                <LinearGradient
                  colors={isolationColors[tier]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.horizontalBarFill}
                />
              </View>
            </View>
            <Text style={styles.horizontalBarValue}>{Math.round(entry.isolationScore)}%</Text>
          </Pressable>
        );
      })}
      <View style={styles.chartLegendRow}>
        <LegendSwatch color="#f87171" label="High isolation (> 65%)" />
        <LegendSwatch color="#fb923c" label="Mid (40-65%)" />
        <LegendSwatch color="#4ade80" label="Low (< 40%)" />
      </View>
      <Text style={styles.chartValueText}>
        {tapped ? `${tapped.countryName}: ${Math.round(tapped.isolationScore)}% isolation` : "Tap a country row to focus a value."}
      </Text>
    </View>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.chartLegendItem}>
      <View style={[styles.chartLegendSwatch, { backgroundColor: color }]} />
      <Text style={styles.chartLegendText}>{label}</Text>
    </View>
  );
}

function DiscoveryGapHistogram({ data }: { data: ApiGapBucket[] }) {
  const sorted = [...data].sort((left, right) => left.bucketOrder - right.bucketOrder);
  return (
    <VerticalBarChart
      data={sorted.map((bucket) => ({
        label: bucket.bucketLabel,
        value: bucket.songCount,
        valueLabel: bucket.songCount.toLocaleString(),
      }))}
      colors={["#8B9BC0", "#8B5E7A"]}
    />
  );
}

function trendChartData(data: ApiTrendPoint[], valueKey: "overlapPct" | "avgCountries") {
  const ds1 = data.filter((point) => !point.isGap && point.periodYear <= 2021);
  const ds2 = data.filter((point) => !point.isGap && point.periodYear >= 2023);
  const gapEntry: ApiTrendPoint = {
    periodYear: 2022,
    periodLabel: "gap",
    periodMonth: null,
    overlapPct: 0,
    avgCountries: 0,
    totalUniqueSongs: 0,
    songsIn2Plus: 0,
    isGap: true,
  };

  return [...ds1, gapEntry, ...ds2].map((point) => ({
    label: point.isGap ? "gap" : `${point.periodYear}${point.periodYear === 2023 ? "*" : ""}`,
    value: point[valueKey],
    valueLabel: point.isGap
      ? "No data"
      : valueKey === "overlapPct"
        ? `${Math.round(point[valueKey])}%`
        : Number(point[valueKey]).toFixed(2),
    isGap: point.isGap,
    isDimmed: point.periodYear >= 2023,
  }));
}

function OverlapTrendChart({ data }: { data: ApiTrendPoint[] }) {
  return (
    <View style={styles.chartShell}>
      <VerticalBarChart data={trendChartData(data, "overlapPct")} colors={["#C488A3", colors.accent]} />
      <View style={styles.chartLegendRow}>
        <LegendSwatch color={colors.accent} label="2017-2021 (Top 200 only)" />
        <LegendSwatch color="transparent" label="2023-2025 dimmed (Top 50 only)" />
        <Text style={[styles.chartLegendText, styles.warningLegend]}>* 2023 = Oct-Dec only</Text>
      </View>
    </View>
  );
}

function GlobalReachChart({ data }: { data: ApiTrendPoint[] }) {
  return (
    <View style={styles.chartShell}>
      <VerticalBarChart data={trendChartData(data, "avgCountries")} colors={["#4ade80", "#627F8A"]} />
      <View style={styles.chartLegendRow}>
        <LegendSwatch color="#4ade80" label="2017-2021" />
        <LegendSwatch color="#627F8A" label="2023-2025 dimmed" />
        <Text style={[styles.chartLegendText, styles.warningLegend]}>* 2023 = Oct-Dec only</Text>
      </View>
    </View>
  );
}

function AboutThisData({ discoveryGap }: { discoveryGap: ApiDiscoveryGap | null }) {
  const [open, setOpen] = useState(false);
  const dynamicEntries = [
    ...aboutEntries,
    {
      icon: "i",
      iconType: "blue" as const,
      title: "Discovery gap reflects first crossings only",
      body: discoveryGap
        ? `Mean (${discoveryGap.avgGapDays}d) and median (${discoveryGap.medianGapDays}d) diverge because crossover is bimodal. Songs that never crossed any border are excluded. Sample size: ${discoveryGap.sampleSize.toLocaleString()} songs.`
        : "Mean and median diverge because crossover is bimodal. Songs that never crossed any border are excluded.",
    },
  ];

  return (
    <View style={styles.aboutSection}>
      <Pressable style={({ pressed }) => [styles.aboutToggleRow, pressed ? styles.pressablePressed : null]} onPress={() => setOpen((current) => !current)}>
        <Text style={styles.aboutToggleLabel}>About this data - sources, limitations & methodology</Text>
        <Text style={styles.aboutChevron}>{open ? "▲" : "▼"}</Text>
      </Pressable>
      {open ? (
        <View style={styles.aboutEntries}>
          {dynamicEntries.map((entry, index) => (
            <View key={`${entry.title}-${index}`} style={styles.aboutEntry}>
              <View style={[styles.aboutIconWrap, { backgroundColor: `${iconColors[entry.iconType]}22` }]}>
                <Text style={[styles.aboutIconText, { color: iconColors[entry.iconType] }]}>{entry.icon}</Text>
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

export function DashboardScreen({
  countries = [],
  onOpenDiscovery,
  onOpenHiddenGems,
  onOpenComparison,
}: Props) {
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
  const loadingText = useLoadingText(loading, "Loading Discovery Dashboard");

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

    loadDashboardCountriesWithAppData(countries)
      .then(setDashboardCountries)
      .catch(() => setDashboardCountries([]));
  }, [countries]);

  const notCrossingPct = useMemo(
    () => (overlapRate ? Math.round(100 - overlapRate.overlapPct) : null),
    [overlapRate]
  );

  const isolationSpread = useMemo(() => {
    if (isolationRanking.length < 2) {
      return null;
    }
    const scores = isolationRanking.map((entry) => entry.isolationScore);
    return Math.round(Math.max(...scores) - Math.min(...scores));
  }, [isolationRanking]);

  const countryOptions = useMemo<CountrySelectorOption[]>(() => {
    const isolationByCode = new Map(isolationRanking.map((entry) => [entry.isoCode.toUpperCase(), entry]));
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
      .sort((left, right) => left.countryName.localeCompare(right.countryName));
  }, [dashboardCountries, isolationRanking]);

  const overlapChange = useMemo(() => {
    const nonGap = trendData.filter((point) => !point.isGap && point.overlapPct > 0);
    const pt2017 = nonGap.find((point) => point.periodYear === 2017);
    const pt2021 = nonGap.find((point) => point.periodYear === 2021);
    if (!pt2017 || !pt2021) {
      return null;
    }
    return {
      delta: Math.round(Math.abs(pt2021.overlapPct - pt2017.overlapPct)),
      pct2017: Math.round(pt2017.overlapPct),
      pct2021: Math.round(pt2021.overlapPct),
      direction: pt2021.overlapPct >= pt2017.overlapPct ? "rose" : "fell",
    };
  }, [trendData]);

  const selectedCountryHasIsolation = selectedCountry?.isolationScore !== null && selectedCountry?.isolationScore !== undefined;
  const isolationCardScore = selectedCountry
    ? selectedCountryHasIsolation
      ? Math.round(selectedCountry.isolationScore as number)
      : null
    : isolationLeader
      ? Math.round(isolationLeader.isolationScore)
      : null;
  const isolationCardName = selectedCountry?.countryName ?? isolationLeader?.countryName ?? "";
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
      ? kpiBar.red
      : (selectedCountry?.isolationScore as number) >= 40
        ? "#fb923c"
        : kpiBar.green
    : selectedCountry
      ? kpiBar.blue
      : kpiBar.red;

  const countryLabel = selectedCountry?.countryName ?? null;
  const countryCode = selectedCountry?.isoCode;
  const gemLabel = countryLabel ? `Find ${countryLabel}'s hidden gems` : "Find hidden gems";
  const globeLabel = countryLabel ? `See ${countryLabel} on the map` : "Explore these gaps on the map";
  const missingLabel = countryLabel ? `Find what ${countryLabel} is missing` : "Find what your country is missing";

  const peakDateStr = peakReach?.peakDate
    ? (() => {
        const date = new Date(peakReach.peakDate);
        return `peak ${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
      })()
    : null;
  const peakReachArtUrl = peakReach?.albumArtUrl ?? getKnownPeakReachArtUrl(peakReach?.songTitle, peakReach?.artistName);

  const openDiscovery = () => onOpenDiscovery?.(countryCode);
  const openHiddenGems = () => onOpenHiddenGems?.(countryCode);
  const openComparison = () => onOpenComparison?.();

  if (loading || fetchError) {
    return (
      <ScreenScaffold>
        <View style={styles.statusShell}>
          <Text style={[styles.statusText, fetchError ? styles.statusError : null]}>
            {fetchError ?? loadingText}
          </Text>
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <LinearGradient colors={heroGradient} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View style={styles.contentInner}>
            <View style={styles.heroContent}>
              <Text style={styles.heroOverline}>The discovery gap - a data story</Text>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroH1}>
                  {"Most music never leaves "}
                  <Text style={styles.heroH1Accent}>home.</Text>
                </Text>
                <GemIcon size={30} style={styles.heroGemIcon} />
              </View>
              <Text style={styles.heroBody}>
                A song can be charting in 30 countries and completely unknown in yours. This isn't a taste difference - it's a structural gap in how music travels.
              </Text>
              <CountrySelector data={countryOptions} selectedCountry={selectedCountry} onSelect={setSelectedCountry} onClear={() => setSelectedCountry(null)} />
              <View style={styles.scrollHint}>
                <View style={styles.scrollHintLine} />
                <Text style={styles.scrollHintText}>scroll to explore</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.chapterWrap}>
          <View style={styles.contentInner}>
            <ChapterLabel num={1} title="THE GAP EXISTS" />
            <View style={styles.chapterStack}>
              {notCrossingPct !== null ? (
                <PullStat number={String(notCrossingPct)} unit="%" context="of all charting songs never appeared in a second country's charts." />
              ) : null}
              {notCrossingPct !== null && overlapRate ? (
                <ArgumentText>
                  Out of every 100 songs that charted anywhere in the world between 2017 and 2025,{" "}
                  <Text style={styles.argBold}>{notCrossingPct} stayed home.</Text> They charted, they disappeared, and no other market ever heard of them. The remaining{" "}
                  <Text style={styles.argBold}>{Math.round(overlapRate.overlapPct)} crossed at least one border</Text> - and a handful crossed dozens.
                </ArgumentText>
              ) : null}
              <CtaRow>
                <CtaButton label={globeLabel} primary onPress={openDiscovery} />
                <CtaButton label={gemLabel} onPress={openHiddenGems} />
              </CtaRow>
            </View>

            {gapDistribution.length > 0 ? (
              <>
                <ChapterCard label="DISCOVERY GAP DISTRIBUTION">
                  <DiscoveryGapHistogram data={gapDistribution} />
                </ChapterCard>
                <Text style={[styles.pullQuote, styles.histogramPullQuote]}>
                  Most songs that cross any border do so within two weeks. The long tail - songs that took months or never arrived at all - is what the discovery gap is made of.
                </Text>
              </>
            ) : null}

            <View style={styles.kpiGrid}>
              {overlapRate ? (
                <KpiCard
                  barColor={kpiBar.purple}
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
                        {Math.round(100 - overlapRate.overlapPct)}% of charting music stayed in exactly one country. The {Math.round(overlapRate.overlapPct)}% that crossed is what this app is built to help you find.
                      </Text>
                      <Pressable onPress={openDiscovery}>
                        <Text style={styles.kpiCta}>Explore map</Text>
                      </Pressable>
                    </View>
                  }
                />
              ) : null}

              {discoveryGap ? (
                <KpiCard
                  barColor={kpiBar.blue}
                  front={
                    <View style={styles.kpiFront}>
                      <Text style={styles.kpiLabel}>Discovery Gap</Text>
                      <Text style={styles.kpiNumber}>{discoveryGap.medianGapDays}d</Text>
                      <Text style={styles.kpiSublabel}>median to cross a border</Text>
                      <Text style={styles.kpiSecondary}>mean: {discoveryGap.avgGapDays} days</Text>
                    </View>
                  }
                  back={
                    <View style={styles.kpiBack}>
                      <Text style={styles.kpiBackTitle}>Why two numbers?</Text>
                      <Text style={styles.kpiBackBody}>
                        Most crossovers happen within days. A long tail of slow-movers pulls the mean to {discoveryGap.avgGapDays}. The median is the real signal.
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
                      <Text style={styles.kpiLabel}>{selectedCountry ? "Your Country" : "Most Isolated Market"}</Text>
                      <Text style={styles.kpiNumber}>{isolationCardScore !== null ? `${isolationCardScore}%` : "-"}</Text>
                      <Text style={styles.kpiSublabel}>{isolationCardName} - {isolationCardTierLabel}</Text>
                    </View>
                  }
                  back={
                    <View style={styles.kpiBack}>
                      <Text style={styles.kpiBackTitle}>{selectedCountry ? "Your country in context" : "Isolation explained"}</Text>
                      <Text style={styles.kpiBackBody}>
                        {selectedCountry
                          ? selectedCountry.isolationScore === null
                            ? `${selectedCountry.countryName} is available in the app data, but the current isolation ranking response does not include a score for it.`
                            : selectedCountry.isolationScore > 65
                              ? `${selectedCountry.countryName} has an isolation score of ${Math.round(selectedCountry.isolationScore)}%. Most of its chart stays local - it has some of the most to discover.`
                              : selectedCountry.isolationScore >= 40
                                ? `${selectedCountry.countryName} has an isolation score of ${Math.round(selectedCountry.isolationScore)}%. Some global crossover, but still plenty of undiscovered music.`
                                : `${selectedCountry.countryName} has an isolation score of ${Math.round(selectedCountry.isolationScore)}%. Its charts overlap heavily with global trends.`
                          : isolationLeader
                            ? `${Math.round(isolationLeader.isolationScore)}% of songs charting in ${isolationLeader.countryName} appeared nowhere else. These are the markets with the most to discover.`
                            : ""}
                      </Text>
                      <Pressable onPress={openHiddenGems}>
                        <Text style={styles.kpiCta}>{gemLabel}</Text>
                      </Pressable>
                    </View>
                  }
                />
              ) : null}

              {peakReach ? (
                <KpiCard
                  barColor={kpiBar.green}
                  front={
                    <View style={styles.kpiFront}>
                      <Text style={styles.kpiLabel}>Peak Cross-Regional Reach</Text>
                      <Text style={styles.kpiNumber}>{peakReach.peakCountryCount}</Text>
                      <Text style={styles.kpiSublabel}>countries at once - peak reach</Text>
                    </View>
                  }
                  back={
                    <View style={styles.kpiBack}>
                      <Text style={styles.kpiBackTitle}>The ceiling</Text>
                      <Text style={styles.kpiBackBody}>
                        {peakReach.songTitle} by {peakReach.artistName} charted in {peakReach.peakCountryCount} countries simultaneously. The average song reaches 3.
                      </Text>
                      <Pressable onPress={openDiscovery}>
                        <Text style={styles.kpiCta}>Explore map</Text>
                      </Pressable>
                    </View>
                  }
                />
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.chapterWrap, styles.chapterElevated]}>
          <View style={styles.contentInner}>
            <ChapterLabel num={2} title="THE GAP IS GEOGRAPHIC" />
            <View style={styles.chapterStack}>
              {isolationSpread !== null ? (
                <PullStat number={String(isolationSpread)} unit="pts" context="difference between the most and least isolated market in this dataset." />
              ) : null}
              <Text style={styles.isolationExplainer}>
                Isolation score = % of a country's charting songs that appeared nowhere else in the world.
              </Text>
              <ArgumentText>
                The gap isn't evenly distributed. Some markets are deeply wired into global trends. Others are almost entirely self-contained.{" "}
                <Text style={styles.argBold}>Where your country falls determines how much music you're missing.</Text>
              </ArgumentText>
              <CtaRow>
                <CtaButton label={countryLabel ? `See ${countryLabel} on the map` : "See this on the map"} primary onPress={openDiscovery} />
                <CtaButton label="Compare two countries" onPress={openComparison} />
              </CtaRow>
            </View>
            {isolationRanking.length > 0 ? (
              <ChapterCard label="ISOLATION SCORES BY COUNTRY">
                <HorizontalIsolationChart data={isolationRanking} selectedCountry={selectedCountry} />
              </ChapterCard>
            ) : null}
          </View>
        </View>

        <View style={styles.chapterWrap}>
          <View style={styles.contentInner}>
            <ChapterLabel num={3} title="THE GAP IS MEASURABLE OVER TIME" />
            <View style={styles.chapterStack}>
              {overlapChange !== null ? (
                <PullStat
                  number={`${overlapChange.direction === "rose" ? "+" : "-"}${overlapChange.delta}`}
                  unit="pts"
                  context={`overlap ${overlapChange.direction} from ${overlapChange.pct2017}% to ${overlapChange.pct2021}% between 2017 and 2021.`}
                />
              ) : null}
              <ArgumentText>
                Global overlap was <Text style={styles.argBold}>improving through 2021.</Text> Then the data stops. When it resumes in late 2023, the picture looks different - <Text style={styles.argBold}>but that may be the data, not reality.</Text>
              </ArgumentText>
              <View style={styles.warningTagRow}>
                <WarningTag type="orange" label="! 22-month gap - broken, not interpolated" />
                <WarningTag type="blue" label="i 2017-2021 data vs 2023-2025 data uses different chart pools" />
              </View>
            </View>
            {trendData.length > 0 ? (
              <>
                <ChapterCard label="GLOBAL OVERLAP RATE - 2017-2025">
                  <OverlapTrendChart data={trendData} />
                </ChapterCard>
                <Text style={styles.pullQuote}>
                  The dashed bars use a smaller chart pool. A visual dip after the gap doesn't mean music borders got worse - it partly means we're counting fewer songs per country.
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={[styles.chapterWrap, styles.chapterElevated]}>
          <View style={styles.contentInner}>
            <ChapterLabel num={4} title="THE CEILING" />
            <View style={styles.chapterStack}>
              {peakReach ? (
                <PullStat number={String(peakReach.peakCountryCount)} context="countries at once. The most connected a song has ever been in this dataset." />
              ) : null}
              {peakReach ? (
                <>
                  <ArgumentText>
                    The average charting song reaches <Text style={styles.argBold}>3 countries.</Text> The record is {peakReach.peakCountryCount}. Between those two numbers is{" "}
                    <Text style={styles.argBold}>every song trending somewhere right now that hasn't reached you yet.</Text>
                  </ArgumentText>
                  <View style={styles.songRefCard}>
                    <CdCaseArt size={74} placeholderColor={rowBackdropColors[0]} artImageUrl={peakReachArtUrl} loading={!peakReachArtUrl} />
                    <View style={styles.songRefInfo}>
                      <Text style={styles.songRefTitle}>{peakReach.songTitle}</Text>
                      <Text style={styles.songRefArtist}>{peakReach.artistName}{peakDateStr ? ` · ${peakDateStr}` : ""}</Text>
                    </View>
                    <View style={styles.songRefCount}>
                      <Text style={styles.songRefNumber}>{peakReach.peakCountryCount}</Text>
                      <Text style={styles.songRefCountLabel}>countries at once</Text>
                    </View>
                  </View>
                  <View style={styles.warningTagRow}>
                    <WarningTag type="orange" label="! 2023 = Oct-Dec only" />
                    <WarningTag type="blue" label="i 2023-2025 uses Top 50 charts only" />
                  </View>
                  <CtaRow>
                    <CtaButton label={missingLabel} primary onPress={openHiddenGems} />
                    <CtaButton label="Explore on the map" onPress={openDiscovery} />
                  </CtaRow>
                </>
              ) : null}
            </View>
            {trendData.length > 0 ? (
              <ChapterCard label="AVERAGE COUNTRIES PER SONG - 2017-2025">
                <GlobalReachChart data={trendData} />
              </ChapterCard>
            ) : null}
          </View>
        </View>

        <View style={styles.conclusionWrap}>
          <LinearGradient colors={heroGradient} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View style={styles.contentInner}>
            <View style={styles.conclusionStack}>
              <Text style={styles.conclusionHeadline}>
                {"The gap is real. The music is "}
                <Text style={styles.conclusionAccent}>out there.</Text>
              </Text>
              <Text style={styles.conclusionBody}>
                {notCrossingPct !== null ? `${notCrossingPct}%` : "-"} of charting songs never crossed a single border. The ones that did spread fast - most within days. A handful reached {peakReach ? peakReach.peakCountryCount : "-"} countries at once. Everything in between is waiting to be discovered.
              </Text>
              <View style={styles.conclusionCtas}>
                <CtaButton label={missingLabel} primary onPress={openHiddenGems} />
                <CtaButton label="Explore on the map" onPress={openDiscovery} />
              </View>
              <View style={styles.statGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{notCrossingPct !== null ? `${notCrossingPct}%` : "-"}</Text>
                  <Text style={styles.statLabel}>of music never leaves its home market</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{discoveryGap ? `${discoveryGap.medianGapDays}d` : "-"}</Text>
                  <Text style={styles.statLabel}>median time to cross a border</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{peakReach ? peakReach.peakCountryCount : "-"}</Text>
                  <Text style={styles.statLabel}>countries - the ceiling one song ever reached</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{isolationLeader ? `${Math.round(isolationLeader.isolationScore)}%` : "-"}</Text>
                  <Text style={styles.statLabel}>isolation - the most self-contained market</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.contentInner}>
          <AboutThisData discoveryGap={discoveryGap} />
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  contentInner: {
    width: "100%",
    paddingHorizontal: 18,
  },
  heroWrap: {
    overflow: "hidden",
    paddingTop: 54,
    paddingBottom: 46,
  },
  heroContent: {
    alignItems: "center",
    gap: 18,
  },
  heroOverline: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.38,
    textAlign: "center",
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
    fontSize: 40,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 46,
  },
  heroH1Accent: {
    color: colors.accent,
  },
  heroGemIcon: {
    opacity: 0.82,
  },
  heroBody: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 23,
    opacity: 0.68,
    textAlign: "center",
  },
  scrollHint: {
    alignItems: "center",
    gap: 6,
    opacity: 0.34,
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
  countrySelectorWrap: {
    width: "100%",
    gap: 8,
  },
  countrySelectorPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
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
    borderWidth: 1,
    borderColor: "rgba(117,82,107,0.3)",
    backgroundColor: colors.backgroundRaised,
    maxHeight: 210,
    overflow: "hidden",
  },
  countryDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
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
  countryDropdownMeta: {
    alignItems: "flex-end",
    gap: 1,
  },
  countryDropdownScore: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 12,
    fontWeight: "600",
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
    borderWidth: 1,
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
    opacity: 0.65,
  },
  chapterWrap: {
    paddingVertical: 50,
  },
  chapterElevated: {
    backgroundColor: "rgba(255,255,255,0.018)",
  },
  chapterLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 34,
  },
  chapterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    flex: 1,
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "500",
    opacity: 0.78,
  },
  chapterStack: {
    gap: 18,
    marginBottom: 28,
  },
  pullStat: {
    gap: 8,
  },
  pullStatDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    paddingRight: 6,
  },
  pullStatNumber: {
    color: colors.accent,
    fontFamily: typefaces.display,
    fontSize: 86,
    fontWeight: "700",
    lineHeight: 92,
    paddingRight: 4,
  },
  pullStatUnit: {
    color: colors.accent,
    fontFamily: typefaces.display,
    fontSize: 50,
    fontWeight: "700",
    lineHeight: 56,
    marginLeft: 2,
    paddingRight: 4,
  },
  pullStatContext: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.48,
  },
  isolationExplainer: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.56,
    fontStyle: "italic",
  },
  argument: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 27,
  },
  argBold: {
    color: colors.textStrong,
    fontWeight: "500",
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  ctaButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  ctaButtonPrimary: {
    borderColor: "rgba(117,82,107,0.6)",
    backgroundColor: "rgba(117,82,107,0.12)",
  },
  ctaButtonSecondary: {
    borderColor: "rgba(117,130,160,0.3)",
    backgroundColor: "transparent",
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.86,
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
    opacity: 0.78,
  },
  warningTagRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  warningTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  chapterCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  chapterCardLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.3,
  },
  pullQuote: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    opacity: 0.42,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(117,82,107,0.35)",
    paddingLeft: 12,
    marginTop: 12,
  },
  histogramPullQuote: {
    marginBottom: 12,
  },
  kpiGrid: {
    gap: 12,
  },
  kpiCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    height: 170,
    overflow: "hidden",
  },
  kpiCardFlipped: {
    backgroundColor: "rgba(117,82,107,0.08)",
    borderColor: "rgba(117,82,107,0.25)",
  },
  kpiAccentBar: {
    width: 4,
    alignSelf: "stretch",
  },
  kpiContent: {
    flex: 1,
    height: 170,
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
    flex: 1,
    gap: 8,
    justifyContent: "space-between",
  },
  kpiLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 13,
    opacity: 0.64,
  },
  kpiNumber: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 42,
    paddingRight: 4,
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
    opacity: 0.54,
  },
  kpiFlipHint: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 10,
    opacity: 0.4,
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
    opacity: 0.78,
  },
  kpiCta: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 12,
    fontWeight: "500",
  },
  chartShell: {
    gap: 10,
  },
  verticalChart: {
    minHeight: 190,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingTop: 18,
    paddingBottom: 8,
  },
  verticalBarSlot: {
    flex: 1,
    minWidth: 28,
    alignItems: "center",
    gap: 7,
  },
  verticalBarValueWrap: {
    height: 150,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  verticalBarOuter: {
    width: "68%",
    minWidth: 14,
    maxWidth: 28,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  verticalBarFill: {
    flex: 1,
    borderRadius: 4,
  },
  verticalBarLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 10,
    lineHeight: 13,
    opacity: 0.68,
    textAlign: "center",
  },
  gapMarker: {
    alignItems: "center",
    height: 112,
    justifyContent: "flex-end",
    gap: 4,
  },
  gapLine: {
    width: 1,
    height: 92,
    borderLeftWidth: 1,
    borderColor: "#fb923c",
    borderStyle: "dashed",
  },
  gapLabel: {
    color: "#fb923c",
    fontFamily: typefaces.body,
    fontSize: 9,
  },
  gapText: {
    color: "#fb923c",
  },
  chartValuePanel: {
    minHeight: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.035)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chartValueText: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.72,
  },
  chartLegendRow: {
    flexDirection: "row",
    gap: 12,
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  chartLegendText: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.62,
  },
  warningLegend: {
    color: "#fb923c",
  },
  horizontalChartShell: {
    gap: 8,
  },
  averageMarkerRow: {
    alignItems: "flex-end",
  },
  averageMarkerText: {
    color: "rgba(255,255,255,0.42)",
    fontFamily: typefaces.body,
    fontSize: 10,
  },
  horizontalBarRow: {
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
  },
  horizontalBarRowSelected: {
    backgroundColor: "rgba(117,82,107,0.12)",
  },
  horizontalBarLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  horizontalBarCountry: {
    flex: 1,
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 12,
    opacity: 0.85,
  },
  selectedText: {
    color: colors.accent,
  },
  youBadge: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 9,
    borderWidth: 1,
    borderColor: "rgba(117,82,107,0.5)",
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  horizontalBarTrack: {
    height: 17,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
    position: "relative",
  },
  averageMarker: {
    position: "absolute",
    left: `${globalAverageIsolation}%`,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
    zIndex: 2,
  },
  horizontalBarFillWrap: {
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },
  horizontalBarFill: {
    flex: 1,
  },
  horizontalBarValue: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 11,
    textAlign: "right",
    opacity: 0.76,
  },
  songRefCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
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
    paddingRight: 3,
  },
  songRefCountLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 10,
    opacity: 0.6,
  },
  conclusionWrap: {
    overflow: "hidden",
    paddingVertical: 56,
  },
  conclusionStack: {
    gap: 20,
  },
  conclusionHeadline: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
  },
  conclusionAccent: {
    color: colors.accent,
  },
  conclusionBody: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.78,
  },
  conclusionCtas: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 13,
    gap: 6,
  },
  statNumber: {
    color: colors.accent,
    fontFamily: typefaces.display,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 39,
    paddingRight: 4,
  },
  statLabel: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.68,
  },
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
    gap: 12,
  },
  aboutToggleLabel: {
    flex: 1,
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    opacity: 0.78,
  },
  aboutChevron: {
    color: colors.text,
    fontSize: 11,
    opacity: 0.52,
  },
  aboutEntries: {
    gap: 0,
    marginTop: 8,
  },
  aboutEntry: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
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
  statusShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 260,
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
  pressablePressed: {
    opacity: 0.78,
  },
});
