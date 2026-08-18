import "react-native-reanimated";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/context/AuthContext";
import { CoffeeProvider } from "@/context/CoffeeContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CoffeeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />

        <StatusBar style="dark" />
      </CoffeeProvider>
    </AuthProvider>
  );
}