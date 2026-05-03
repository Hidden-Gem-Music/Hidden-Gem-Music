import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  onNavigate: (route: any) => void;
};

export function FiltersScreen({ onNavigate }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filters</Text>

      <Text style={styles.subtitle}>
        Native filters screen placeholder
      </Text>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={styles.button}
        onPress={() => onNavigate("welcome")}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
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
    fontSize: 28,
    color: "#afcbff",
    textAlign: "center",
    marginTop: 80,
  },
  subtitle: {
    fontSize: 14,
    color: "#afcbff",
    textAlign: "center",
    marginTop: 12,
    opacity: 0.7,
  },
  button: {
    backgroundColor: "#3a4161",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 40,
  },
  buttonText: {
    color: "#afcbff",
  },
});