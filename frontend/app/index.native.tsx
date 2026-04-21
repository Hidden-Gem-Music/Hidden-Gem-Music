import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Entypo from '@expo/vector-icons/Entypo';
export default function Mobile() {
  const router = useRouter();
  
  return (
    <View style={{ flex: 1, justifyContent: "space-between", alignItems: "center", backgroundColor: "#24293e", paddingVertical: 50 }}>
      <Text style={{ color: "#afcbff", fontSize: 24, textAlign: "center", padding: 50 }}>Welcome to Hidden Gem Music</Text>

      <Text style={{ color: "#afcbff", fontSize: 16, textAlign: "center", paddingHorizontal: 20 }}>description</Text>

      <View style={{ flex: 1 }} />

      

      <View style={{ flexDirection: "row", gap: 20, marginBottom: 30 }}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/globe")} style={{ backgroundColor: "#3a4161", padding: 20, borderRadius: 8, alignItems: "center" }}>
          <Entypo name="globe" size={24} color="#afcbff" />
          <Text style={{ color: "#afcbff", marginTop: 10 }}>Globe</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(tabs)/filters")} style={{ backgroundColor: "#3a4161", padding: 20, borderRadius: 8, alignItems: "center" }}>
          <Entypo name="funnel" size={24} color="#afcbff" />
          <Text style={{ color: "#afcbff", marginTop: 10 }}>Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}