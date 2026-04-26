import type { Props } from "./DiscoveryScreen.web";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useEffect, useRef, useState } from "react";

/* ================= CONFIG ================= */

const SIZE = 220;

/* ================= HELPERS ================= */

const getFlagEmoji = (countryCode?: string) => {
  if (!countryCode) return "🌍";

  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
};

const getGlobePosition = (index: number, total: number) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = SIZE / 2.4;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
};

const getMockInsights = (id: string) => {
  const seed = id.length * 7;

  return {
    hiddenSongs: (seed % 120) + 20,
    genres: (seed % 25) + 5,
    topAlbum: `Album #${(seed % 10) + 1}`,
  };
};

/* ================= SCREEN ================= */

export function DiscoveryScreen({
  countries,
  onOpenCountry,
  onNavigate,
}: Props) {
  const safeCountries = countries ?? [];
  const listRef = useRef<FlatList>(null);

  const [activeCountryId, setActiveCountryId] = useState<string>(
    safeCountries[0]?.id ?? ""
  );

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [listOpen, setListOpen] = useState(true);

  const activeCountry =
    safeCountries.find((c) => c.id === activeCountryId) ??
    safeCountries[0];

  useEffect(() => {
    const index = safeCountries.findIndex((c) => c.id === activeCountryId);

    if (index >= 0) {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [activeCountryId]);

  const handleSelect = (id: string) => {
    setActiveCountryId(id);
    onOpenCountry(id);
  };

  return (
    <LinearGradient
      colors={["#24293e", "#1b1f33", "#75526B"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ================= TITLE ================= */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Discovery</Text>
          <Text style={styles.pageSubtitle}>
            Explore hidden music cultures around the world
          </Text>
        </View>

        {/* ================= GLOBE ================= */}
        <View style={styles.globeSection}>
          <View style={styles.globe}>
            <View style={styles.globeGlow} />
            <Text style={styles.globeBackground}>🌍</Text>

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

          <Text style={styles.globeLabel}>
            {activeCountry?.name ?? "Explore the World"}
          </Text>
        </View>

        {/* ================= FILTERS BUTTON (NEW FIXED) ================= */}
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={() => onNavigate?.("filters")}
        >
          <Text style={styles.filtersButtonText}>All Filters</Text>
        </TouchableOpacity>

        {/* ================= FILTERS CARD ================= */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setFiltersOpen(!filtersOpen)}
          >
            <Text style={styles.sectionTitle}>Filters</Text>
            <Text style={styles.sectionToggle}>
              {filtersOpen ? "−" : "+"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionBlurb}>
            Refine what data is shown across countries.
          </Text>

          {filtersOpen && (
            <View style={styles.sectionBody}>
              <Text style={styles.placeholderText}>
                (Filter UI goes here)
              </Text>
            </View>
          )}
        </View>

        {/* ================= LIST ================= */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setListOpen(!listOpen)}
          >
            <Text style={styles.sectionTitle}>List View</Text>
            <Text style={styles.sectionToggle}>
              {listOpen ? "−" : "+"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionBlurb}>
            Explore countries and their hidden music stats.
          </Text>

          {listOpen && (
            <LinearGradient
              colors={["rgba(43,48,71,0.7)", "rgba(43,48,71,0.3)"]}
              style={styles.listBackground}
            >
              <FlatList
                ref={listRef}
                data={safeCountries}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
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
                    >
                      <Text style={styles.countryName}>
                        {item.name}
                      </Text>

                      <Text style={styles.countryMeta}>
                        Hidden Songs: {insights.hiddenSongs}
                      </Text>

                      <Text style={styles.countryMeta}>
                        Genres: {insights.genres}
                      </Text>

                      <Text style={styles.countryMeta}>
                        Top Album: {insights.topAlbum}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </LinearGradient>
          )}
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: {
    paddingBottom: 40,
  },

  /* TITLE */
  pageHeader: {
    paddingTop: 50,
    alignItems: "center",
    paddingBottom: 20,
  },

  pageTitle: {
    fontSize: 30,
    color: "#afcbff",
    fontFamily: "NyghtSerif-Regular",
    textAlign: "center",
  },

  pageSubtitle: {
    fontSize: 13,
    color: "#8fa3c7",
    marginTop: 6,
    textAlign: "center",
  },

  /* GLOBE */
  globeSection: {
    alignItems: "center",
    marginBottom: 20,
  },

  globe: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "rgba(43,48,71,0.9)",
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
    fontSize: 16,
  },

  /* FILTER BUTTON (FIXED) */
  filtersButton: {
    alignSelf: "center",
    marginVertical: 14,
    backgroundColor: "#3a4161",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 16,
  },

  filtersButtonText: {
    color: "#afcbff",
    fontSize: 16,
    fontFamily: "Tanklager-Kompakt",
    textAlign: "center",
  },

  /* CARDS */
  sectionCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#2b3047",
    borderRadius: 16,
    overflow: "hidden",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },

  sectionTitle: {
    color: "#afcbff",
    fontSize: 16,
  },

  sectionToggle: {
    color: "#afcbff",
    fontSize: 18,
  },

  sectionBlurb: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    color: "#8fa3c7",
    fontSize: 12,
  },

  sectionBody: {
    padding: 12,
  },

  placeholderText: {
    color: "#8fa3c7",
  },

  /* LIST */
  listBackground: {
    padding: 12,
  },

  countryRow: {
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#3a4161",
    borderRadius: 12,
  },

  countryRowActive: {
    borderWidth: 1,
    borderColor: "#afcbff",
  },

  countryName: {
    color: "#afcbff",
    fontSize: 16,
  },

  countryMeta: {
    color: "#8fa3c7",
    fontSize: 12,
  },
});