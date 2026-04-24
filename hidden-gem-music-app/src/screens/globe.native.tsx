import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type RootStackParamList = {
  Welcome: undefined;
  Globe: undefined;
  Filters: undefined;
};

type GlobeScreenNavigationProp = NavigationProp<RootStackParamList, "Globe">;

export default function GlobeScreen() {
  const navigation = useNavigation<GlobeScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Welcome")}
        style={styles.backButton}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#afcbff" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Globe View</Text>
      <Text style={styles.subtitle}>
        This is where your globe/map will go.
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

  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3a4161",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  backButtonText: {
    color: "#afcbff",
    fontSize: 16,
    fontWeight: "600",
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