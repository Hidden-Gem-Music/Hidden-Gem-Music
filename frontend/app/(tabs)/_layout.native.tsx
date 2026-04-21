import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false,
        tabBarActiveTintColor: "3a4161",
        tabBarInactiveTintColor: "#2e344f",
        tabBarStyle: { backgroundColor: "#2e344f", borderTopWidth: 0 },
     }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="globe" options={{ title: "Globe View" }} />
      <Tabs.Screen name="filters" options={{ title: "Filters" }} />
    </Tabs>
  );
}