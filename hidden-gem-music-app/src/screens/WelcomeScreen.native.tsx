import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  countries: any[];
  onNavigate: (route: any) => void;
  onSelectCountry: (id: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

export function WelcomeScreen({ onNavigate }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hidden Gem Music</Text>

      <Text style={styles.subtitle}>
        Discover hidden music gems from around the world.
      </Text>

      <View style={{ flex: 1 }} />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigate("discovery")}
        >
          <Text style={styles.buttonText}>Globe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigate("comparisonSelect")}
        >
          <Text style={styles.buttonText}>Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#24293e",
    padding: 24,
  },
  title: {
    fontSize: 32,
    color: "#afcbff",
    textAlign: "center",
    marginTop: 60,
  },
  subtitle: {
    fontSize: 16,
    color: "#afcbff",
    textAlign: "center",
    marginTop: 20,
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    backgroundColor: "#3a4161",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#afcbff",
  },
});