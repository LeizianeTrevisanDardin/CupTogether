import { useState } from "react";

import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { router } from "expo-router";

import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();

  const isSmallMobile = width < 380;
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert(
          "Login failed",
          error.message
        );

        return;
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(
        "Login error:",
        error
      );

      Alert.alert(
        "Login failed",
        error?.message ??
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.container,

          isSmallMobile &&
            styles.containerSmall,

          isTablet &&
            styles.containerTablet,

          isDesktop &&
            styles.containerDesktop,
        ]}
      >
        {/* BRAND */}

        <Image
          source={require("@/assets/images/CupIconApp.png")}
          style={[
            styles.logo,

            isSmallMobile &&
              styles.logoSmall,

            isDesktop &&
              styles.logoDesktop,
          ]}
        />

        <Text
          style={[
            styles.title,

            isSmallMobile &&
              styles.titleSmall,

            isDesktop &&
              styles.titleDesktop,
          ]}
        >
          Welcome back
        </Text>

        <Text
          style={[
            styles.subtitle,

            isSmallMobile &&
              styles.subtitleSmall,
          ]}
        >
          Sign in to continue to CupTogether.
        </Text>

        {/* FORM */}

        <View style={styles.form}>
          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={[
              styles.input,

              isDesktop &&
                styles.inputDesktop,
            ]}
            placeholder="you@email.com"
            placeholderTextColor="#A48B7F"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            returnKeyType="next"
          />

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={[
              styles.input,

              isDesktop &&
                styles.inputDesktop,
            ]}
            placeholder="Your password"
            placeholderTextColor="#A48B7F"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,

              pressed &&
                !loading &&
                styles.buttonPressed,

              loading &&
                styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Signing in..."
                : "Sign In"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.linkButton,

              pressed &&
                styles.linkPressed,
            ]}
            onPress={() =>
              router.push("/signup")
            }
            disabled={loading}
          >
            <Text style={styles.link}>
              New to CupTogether?{" "}
              <Text style={styles.linkStrong}>
                Create an account
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // ======================================
  // PAGE
  // ======================================

  screen: {
    flex: 1,
    backgroundColor: "#FFF9F5",
    alignItems: "center",
  },

  container: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 90,
    paddingBottom: 40,
  },

  containerSmall: {
    paddingHorizontal: 18,
    paddingTop: 70,
  },

  // TABLET

  containerTablet: {
    width: "100%",
    maxWidth: 680,
    paddingHorizontal: 36,
  },

  // DESKTOP

  containerDesktop: {
    width: "100%",
    maxWidth: 560,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 50,
    justifyContent: "center",
  },

  // ======================================
  // BRAND / LOGO
  // ======================================

  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },

  logoSmall: {
    width: 70,
    height: 70,
  },

  logoDesktop: {
    width: 85,
    height: 85,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#3B241C",
    marginTop: 16,
    letterSpacing: -0.4,
  },

  titleSmall: {
    fontSize: 28,
  },

  titleDesktop: {
    fontSize: 34,
  },

  subtitle: {
    fontSize: 16,
    color: "#76594F",
    marginTop: 8,
    marginBottom: 30,
    lineHeight: 22,
  },

  subtitleSmall: {
    fontSize: 15,
    marginBottom: 26,
  },

  // ======================================
  // FORM
  // ======================================

  form: {
    width: "100%",
    gap: 12,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B241C",
    marginTop: 4,
  },

  input: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DDD7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#3B241C",
  },

  inputDesktop: {
    minHeight: 54,
  },

  // ======================================
  // SIGN IN BUTTON
  // ======================================

  button: {
    width: "100%",
    minHeight: 54,
    backgroundColor: "#6F4E37",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,

    shadowColor: "#3B241C",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  buttonPressed: {
    opacity: 0.88,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  // ======================================
  // SIGN UP LINK
  // ======================================

  linkButton: {
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 6,
  },

  linkPressed: {
    opacity: 0.65,
  },

  link: {
    color: "#76594F",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
  },

  linkStrong: {
    color: "#6F4E37",
    fontWeight: "700",
  },
});