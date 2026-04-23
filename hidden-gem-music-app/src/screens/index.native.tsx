import { View, Text, TouchableOpacity } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";

type RootStackParamList = {
  Home: undefined;
  Globe: undefined;
  Filters: undefined;
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={{ flex: 1, justifyContent: "space-between", alignItems: "center", backgroundColor: "#24293e", paddingVertical: 50 }}>
      
      <Text style={{ color: "#afcbff", fontSize: 24, textAlign: "center", padding: 50 }}>
        Welcome to Hidden Gem Music
      </Text>

      <Text style={{ color: "#afcbff", fontSize: 16, textAlign: "center", paddingHorizontal: 20 }}>
        insert somewhat long text that describes a problem and solution
      </Text>

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: "row", gap: 20, marginBottom: 30 }}>
        
        <TouchableOpacity
          onPress={() => navigation.navigate("Globe")}
          style={{ backgroundColor: "#3a4161", padding: 20, borderRadius: 8, alignItems: "center" }}
        >
          <Entypo name="globe" size={24} color="#afcbff" />
          <Text style={{ color: "#afcbff", marginTop: 10 }}>Globe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Filters")}
          style={{ backgroundColor: "#3a4161", padding: 20, borderRadius: 8, alignItems: "center" }}
        >
          <Entypo name="funnel" size={24} color="#afcbff" />
          <Text style={{ color: "#afcbff", marginTop: 10 }}>Filters</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}