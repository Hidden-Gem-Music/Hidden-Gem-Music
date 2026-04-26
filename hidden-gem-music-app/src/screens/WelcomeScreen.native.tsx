import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  countries: any[];
  onNavigate: (route: any) => void;
  onSelectCountry: (id: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

export function WelcomeScreen({
  onNavigate,
  countries,
  onSelectCountry,
  selectedYear,
  onChangeYear,
}: Props) {
  return (
    <LinearGradient
  colors={["#24293e", "#1b1f33", "#75526B"]}
  style={styles.container}
>
      <Text style={styles.title}>Hidden Gem Music</Text>

      <Text style={styles.subtitle}>
        Discover hidden music gems from around the world. Explore different
        countries, compare trends, and uncover songs you’ve never heard before.
      </Text>

      <View style={{ flex: 1 }} />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigate("discovery")}
        >
          <MaterialCommunityIcons name="earth" size={26} color="#afcbff" />
          <Text style={styles.buttonText}>Globe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigate("filters")}
        >
          <Feather name="filter" size={26} color="#afcbff" />
          <Text style={styles.buttonText}>Filters</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  title: {
    fontSize: 32,
    color: "#afcbff",
    textAlign: "center",
    marginTop: 80,
    
    fontFamily: "NyghtSerif-Regular",
  },

  subtitle: {
    fontSize: 16,
    color: "#afcbff",
    textAlign: "center",
    marginTop: 150,
    fontFamily: "Tanklager-Kompakt",
    
  },

  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 40,
  },

  button: {
    flex: 1,
    backgroundColor: "#3a4161",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#afcbff",
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
  },
});