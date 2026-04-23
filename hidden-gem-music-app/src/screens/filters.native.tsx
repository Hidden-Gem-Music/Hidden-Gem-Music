import { View, Text, StyleSheet } from "react-native";

export default function FiltersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filters</Text>
      <Text style={styles.subtitle}>
        Add your filtering options here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#24293e",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },

  subtitle: {
    fontSize: 16,
    color: "#aaaaaa",
    marginTop: 10,
    textAlign: "center",
  },
});