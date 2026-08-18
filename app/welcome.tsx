import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <View style={styles.container}>
      {/* LOGO */}
      <View style={styles.logoContainer}>
        <Image
          source={require(
            "@/assets/images/LogoApp.png"
          )}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* TITLE */}
      <Text style={styles.title}>
        CupTogether
      </Text>

      {/* SUBTITLE */}
      <Text style={styles.subtitle}>
        Coffee tastes better together.
      </Text>

      {/* GET STARTED */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleGetStarted}
      >
        <Text style={styles.buttonText}>
          Get Started
        </Text>
      </Pressable>

      {/* LOGIN */}
      <Pressable
        onPress={() => router.push("/login")}
      >
        <Text style={styles.loginText}>
          Already have an account? Sign In
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // SCREEN
  // ==========================================

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 24,

    backgroundColor: "#FFF9F5",
  },

  // ==========================================
  // LOGO
  // ==========================================

  logoContainer: {
    width: 140,
    height: 140,

    borderRadius: 70,

    borderWidth: 2,
    borderColor: "#E8DDD7",

    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    overflow: "hidden",

    marginBottom: 24,

    // iOS
    shadowColor: "#3B241C",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,

    // Android
    elevation: 4,
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  // ==========================================
  // TEXT
  // ==========================================

  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#3B241C",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 17,
    color: "#76594F",

    textAlign: "center",

    marginTop: 10,
    marginBottom: 40,
  },

  // ==========================================
  // BUTTON
  // ==========================================

  button: {
    backgroundColor: "#6F4E37",

    paddingVertical: 15,
    paddingHorizontal: 45,

    borderRadius: 30,

    minWidth: 180,

    alignItems: "center",
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  // ==========================================
  // LOGIN
  // ==========================================

  loginText: {
    color: "#6F4E37",

    fontSize: 15,
    fontWeight: "600",

    marginTop: 24,

    textAlign: "center",
  },
});