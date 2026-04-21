import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = "dark";
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0,
        },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="globe"
        options={{
          title: "Globe View",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="globe" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="filters"
        options={{
          title: "Filters",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="line.3.horizontal.decrease.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}