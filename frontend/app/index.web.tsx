import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Web() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" }}>
      <Text style={{ color: "#fff", fontSize: 32 }}>🌐 Web Welcome</Text>

      <TouchableOpacity onPress={() => router.push("/(tabs)")}>
        <Text style={{ color: "#0f0", marginTop: 20 }}>Enter App</Text>
      </TouchableOpacity>
    </View>
  );
}