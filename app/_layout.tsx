import "react-native-reanimated";

import { useEffect } from "react";

import {
  Platform,
} from "react-native";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import {
  AuthProvider,
} from "@/context/AuthContext";

import {
  CoffeeProvider,
} from "@/context/CoffeeContext";

export default function RootLayout() {
  // ==========================================
  // WEB PASSWORD INPUT FIX
  // ==========================================

  useEffect(() => {
    if (
      Platform.OS !== "web"
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.innerHTML = `
      input::-ms-reveal,
      input::-ms-clear {
        display: none;
      }

      input[type="password"]::-webkit-credentials-auto-fill-button,
      input[type="password"]::-webkit-contacts-auto-fill-button {
        visibility: hidden;
        display: none !important;
        pointer-events: none;
      }
    `;

    document.head.appendChild(
      style
    );

    return () => {
      document.head.removeChild(
        style
      );
    };
  }, []);

  return (
    <AuthProvider>
      <CoffeeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />

        <StatusBar
          style="dark"
        />
      </CoffeeProvider>
    </AuthProvider>
  );
}