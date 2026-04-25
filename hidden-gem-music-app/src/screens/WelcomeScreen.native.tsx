import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenRoute } from "../types/navigation";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  onNavigate: (route: ScreenRoute) => void;
};

export function MobileWelcomeScreen({ onNavigate }: Props) {
  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Hidden Gem Music</Text>

      {/* Description */}
      <Text style={styles.subtitle}>
        Discover hidden music gems across countries and years. Explore global
        culture, compare trends, and uncover songs you’ve never heard before.
      </Text>

      <View style={{ flex: 1 }} />

      {/* Main Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigate("discovery")}
        >
          <Text style={styles.buttonText}>Discovery Globe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigate("comparisonSelect")}
        >
          <Text style={styles.buttonText}>Comparison Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigate("hiddenGems")}
        >
          <Text style={styles.buttonText}>Hidden Songs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigate("dashboard")}
        >
          <Text style={styles.buttonText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigate("credits")}
        >
          <Text style={styles.buttonText}>Credits</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingVertical: 60,
  },

  title: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 34,
    textAlign: "center",
    marginBottom: 18,
  },

  subtitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.9,
  },

  buttonContainer: {
    gap: 14,
    marginBottom: 30,
  },

  button: {
    backgroundColor: colors.panel,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: colors.textStrong,
    fontSize: 16,
    fontFamily: typefaces.body,
  },
});