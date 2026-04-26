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
        Insert a semi long description of the app here. Maybe something about how it can help you discover new music and artists from around the world, and how it uses data to find hidden gems that you might not have heard of before.
      </Text>

      <View style={{ flex: 1 }} />

      <View style={styles.buttonContainer}>
  <TouchableOpacity style={styles.button} onPress={() => onNavigate("discovery")}>
    <MaterialCommunityIcons name="earth" size={22} color="#afcbff" />
    <Text style={styles.buttonText}>Globe</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.button} onPress={() => onNavigate("filters")}>
    <Feather name="filter" size={22} color="#afcbff" />
    <Text style={styles.buttonText}>Filters</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.button} onPress={() => onNavigate("comparisonSelect")}>
    <MaterialCommunityIcons name="compare" size={22} color="#afcbff" />
    <Text style={styles.buttonText}>Compare</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.button} onPress={() => onNavigate("hiddenGems")}>
    <MaterialCommunityIcons name="music" size={22} color="#afcbff" />
    <Text style={styles.buttonText}>Hidden Gems</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.button} onPress={() => onNavigate("dashboard")}>
    <MaterialCommunityIcons name="view-dashboard" size={22} color="#afcbff" />
    <Text style={styles.buttonText}>Dashboard</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.button} onPress={() => onNavigate("credits")}>
    <Feather name="info" size={22} color="#afcbff" />
    <Text style={styles.buttonText}>Credits</Text>
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
    
    fontFamily: "NyghtSerif-MediumItalic",
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
  flexWrap: "wrap",   // ✅ allows multiple rows
  gap: 12,
  marginBottom: 40,
},

  button: {
  width: "48%",        // ✅ 2 per row
  backgroundColor: "#3a4161",
  padding: 14,
  borderRadius: 10,
  alignItems: "center",
},

  buttonText: {
    color: "#afcbff",
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
  },
});