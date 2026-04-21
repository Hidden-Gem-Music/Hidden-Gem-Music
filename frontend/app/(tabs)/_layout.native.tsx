import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="globe"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#afcbff",
        tabBarInactiveTintColor: "#afcbff",
        tabBarStyle: {
          backgroundColor: "#24293e",
        }

      }}
    >

      <Tabs.Screen
        name="globe"
        options={{
          title: "Globe View",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="globe" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="filters"
        options={{
          title: "Filters",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="line.3.horizontal.decrease.circle.fill" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
