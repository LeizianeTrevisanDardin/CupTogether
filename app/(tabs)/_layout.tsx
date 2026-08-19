import { Tabs } from "expo-router";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

import { HapticTab } from "@/components/haptic-tab";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,

        tabBarActiveTintColor: "#6F4E37",
        tabBarInactiveTintColor: "#A48B7F",

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F0E6E0",
          height: 85,
          paddingTop: 8,
          paddingBottom: 18,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* FEED */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* ADD COFFEE */}
      <Tabs.Screen
        name="add-coffee"
        options={{
          title: "Add Coffee",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? "add-circle"
                  : "add-circle-outline"
              }
              size={28}
              color={color}
            />
          ),
        }}
      />

      {/* GROUPS */}
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? "people"
                  : "people-outline"
              }
              size={27}
              color={color}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? "person-circle"
                  : "person-circle-outline"
              }
              size={29}
              color={color}
            />
          ),
        }}
      />

      {/* EXPLORE */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? "compass"
                  : "compass-outline"
              }
              size={27}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}