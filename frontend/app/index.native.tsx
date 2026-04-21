import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Mobile() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#24293e" }}>
      <Text style={{ color: "#afcbff", fontSize: 24 }}>Welcome to Hidden Gem Music</Text>

      <TouchableOpacity onPress={() => router.push("/(tabs)")}>
        <Text style={{ color: "#afcbff", marginTop: 20,
         }}>Home</Text>
      </TouchableOpacity>
    </View>
  );
}