import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/WelcomeScreen.native";
import GlobeScreen from "../screens/globe.native";
import FiltersScreen from "../screens/filters.native";

type RootStackParamList = {
  Welcome: undefined;
  Globe: undefined;
  Filters: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function MobileNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{
            title: "Welcome",
          }}
        />
        <Stack.Screen
          name="Globe"
          component={GlobeScreen}
          options={{
            title: "Globe View",
          }}
        />
        <Stack.Screen
          name="Filters"
          component={FiltersScreen}
          options={{
            title: "Filters",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
