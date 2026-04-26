import type { Props } from "./DiscoveryScreen.web";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useEffect, useRef, useState } from "react";

/* =========================================================
   CONFIG
========================================================= */

const SIZE = 220;

/**
 * Converts ISO-like country code into emoji flag
 */
const getFlagEmoji = (countryCode?: string) => {
  if (!countryCode) return "🌍";

  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
};

/**
 * Positions cards evenly around a circular “fake globe”
 */
const getGlobePosition = (index: number, total: number) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = SIZE / 2.4;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
};

/**
 * Generates mock “insight data” for each country card.
 * This will later be replaced by real API data.
 */
const getMockInsights = (id: string) => {
  const seed = id.length * 7;

  return {
    hiddenSongs: (seed % 120) + 20,
    genres: (seed % 25) + 5,
    topAlbum: `Album #${(seed % 10) + 1}`,
  };
};

/* =========================================================
   SCREEN
========================================================= */

export function DiscoveryScreen({
  countries,
  onOpenCountry,
}: Props) {
  const safeCountries = countries ?? [];

  const listRef = useRef<FlatList>(null);

  const [activeCountryId, setActiveCountryId] = useState<string>(
    safeCountries[0]?.id ?? ""
  );

  /**
   * Currently focused country (controls globe + label)
   */
  const activeCountry =
    safeCountries.find((c) => c.id === activeCountryId) ??
    safeCountries[0];

  /**
   * Sync list scroll when active country changes (globe interaction)
   */
  useEffect(() => {
    const index = safeCountries.findIndex(
      (c) => c.id === activeCountryId
    );

    if (index >= 0) {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [activeCountryId]);

  /**
   * Handles selection from either globe OR list
   */
  const handleSelect = (id: string) => {
    setActiveCountryId(id);
    onOpenCountry(id);
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <View style={styles.container}>

      {/* ===================== GLOBE ===================== */}
      <View style={styles.globeContainer}>

        <View style={styles.globe}>

          {/* soft background glow */}
          <View style={styles.globeGlow} />

          {/* base globe icon */}
          <Text style={styles.globeBackground}>🌍</Text>

          {/* orbiting interactive country nodes */}
          {safeCountries.map((country, index) => {
            const pos = getGlobePosition(index, safeCountries.length);
            const isActive = country.id === activeCountryId;

            return (
              <TouchableOpacity
                key={country.id}
                onPress={() => handleSelect(country.id)}
                style={[
                  styles.globeCard,
                  {
                    transform: [
                      { translateX: pos.x },
                      { translateY: pos.y },
                    ],
                  },
                  isActive && styles.globeCardActive,
                ]}
              >
                <Text style={styles.globeCardText}>
                  {getFlagEmoji(country.code ?? country.id)}
                </Text>
              </TouchableOpacity>
            );
          })}

        </View>

        {/* dynamic label under globe */}
        <Text style={styles.globeLabel}>
          {activeCountry?.name ?? "Explore the World"}
        </Text>
      </View>

      {/* ===================== LIST ===================== */}
      <View style={styles.listContainer}>

        <LinearGradient
          colors={["#24293e", "#1b1f33", "#75526B"]}
          style={styles.listBackground}
        >

          <FlatList
            ref={listRef}
            data={safeCountries}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = item.id === activeCountryId;
              const insights = getMockInsights(item.id);

              return (
                <TouchableOpacity
                  style={[
                    styles.countryRow,
                    isActive && styles.countryRowActive,
                  ]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.85}
                >

                  {/* country name */}
                  <Text style={styles.countryName}>
                    {item.name}
                  </Text>

                  {/* FAKE DATA INSIGHTS */}
                  <Text style={styles.countryMeta}>
                    Hidden Songs: {insights.hiddenSongs}
                  </Text>

                  <Text style={styles.countryMeta}>
                    Most Popular Genres: {insights.genres}
                  </Text>

                  <Text style={styles.countryMeta}>
                    Top Album: {insights.topAlbum}
                  </Text>

                </TouchableOpacity>
              );
            }}
          />

        </LinearGradient>
      </View>

    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ================= GLOBE ================= */

  globeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  globe: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "#2b3047",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  globeGlow: {
    position: "absolute",
    width: SIZE * 1.6,
    height: SIZE * 1.6,
    borderRadius: SIZE,
    backgroundColor: "#afcbff",
    opacity: 0.06,
  },

  globeBackground: {
    position: "absolute",
    fontSize: 200,
    opacity: 0.08,
  },

  globeCard: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3a4161",
    alignItems: "center",
    justifyContent: "center",
  },

  globeCardActive: {
    backgroundColor: "#afcbff",
    transform: [{ scale: 1.2 }],
  },

  globeCardText: {
    fontSize: 18,
  },

  globeLabel: {
    marginTop: 12,
    color: "#afcbff",
    fontSize: 18,
    fontFamily: "Tanklager-Kompakt",
  },

  /* ================= LIST ================= */

  listContainer: {
    flex: 1.3,
  },

  listBackground: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
  },

  countryRow: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#3a4161",
    borderRadius: 14,
  },

  countryRowActive: {
    borderWidth: 1,
    borderColor: "#afcbff",
  },

  countryName: {
    color: "#afcbff",
    fontSize: 16,
    fontFamily: "NyghtSerif-Regular",
    marginBottom: 6,
  },

  countryMeta: {
    color: "#8fa3c7",
    fontSize: 12,
    marginTop: 2,
  },
});