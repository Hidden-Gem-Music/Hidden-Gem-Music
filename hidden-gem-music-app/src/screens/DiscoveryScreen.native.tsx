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

const SIZE = 220;

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

export function DiscoveryScreen({
  countries,
  onOpenCountry,
}: Props) {

  const safeCountries = countries ?? [];
  const listRef = useRef<FlatList>(null);

  const [activeCountryId, setActiveCountryId] = useState<string>(
    safeCountries[0]?.id ?? ""
  );

  const activeCountry =
    safeCountries.find((c) => c.id === activeCountryId) ??
    safeCountries[0];

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

  const handleSelect = (id: string) => {
    setActiveCountryId(id);
    onOpenCountry(id);
  };

  return (
    <View style={styles.container}>

      {/* 🌍 GLOBE */}
      <View style={styles.globeContainer}>

        <View style={styles.globe}>

          {/* 🌟 soft glow layer (FIXED DEPTH) */}
          <View style={styles.globeGlow} />

          {/* 🌐 background globe */}
          <Text style={styles.globeBackground}>🌍</Text>

          {/* 🧭 orbiting cards */}
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

      {/* 📜 LIST */}
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

              return (
                <TouchableOpacity
                  style={[
                    styles.countryRow,
                    isActive && styles.countryRowActive,
                  ]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.countryName}>
                    {item.name}
                  </Text>

                  <Text style={styles.countrySubtext}>
                    Tap to explore music →
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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

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

  /* 🌟 FIXED GLOW LAYER */
  globeGlow: {
    position: "absolute",
    width: SIZE * 1.6,
    height: SIZE * 1.6,
    borderRadius: SIZE,
    backgroundColor: "#afcbff",
    opacity: 0.07,
  },

  /* 🌐 globe background (less aggressive now) */
  globeBackground: {
    position: "absolute",
    fontSize: 200,
    opacity: 100,
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
  },

  countrySubtext: {
    color: "#8fa3c7",
    fontSize: 12,
    marginTop: 2,
  },
});