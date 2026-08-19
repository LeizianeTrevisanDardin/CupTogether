import { useState } from "react";

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  // ==========================================
  // STATE
  // ==========================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================
  // RESPONSIVE
  // ==========================================

  const { width } =
    useWindowDimensions();

  const isSmallMobile =
    width < 380;

  const isTablet =
    width >= 768;

  const isDesktop =
    width >= 1024;

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async () => {
    // Clear previous error
    setErrorMessage("");

    // Validate fields
    if (!email.trim() || !password) {
      setErrorMessage(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email
            .trim()
            .toLowerCase(),

          password,
        });

      if (error) {
        console.log(
          "Login error:",
          error.message
        );

        setErrorMessage(
          "Incorrect email or password."
        );

        return;
      }

      // Login successful
      router.replace("/(tabs)");
    } catch (error) {
      console.error(
        "Unexpected login error:",
        error
      );

      setErrorMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EMAIL CHANGE
  // ==========================================

  const handleEmailChange = (
    text: string
  ) => {
    setEmail(text);

    // Remove error when user starts correcting
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ==========================================
  // PASSWORD CHANGE
  // ==========================================

  const handlePasswordChange = (
    text: string
  ) => {
    setPassword(text);

    // Remove error when user starts correcting
    if (errorMessage) {
      setErrorMessage("");
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
        {/* ======================================
            BRAND
        ====================================== */}

        <Image
          source={require(
            "@/assets/images/CupIconApp.png"
          )}
          style={[
            styles.logo,

            isSmallMobile &&
              styles.logoSmall,

            isDesktop &&
              styles.logoDesktop,
          ]}
          resizeMode="contain"
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

        {/* ======================================
            FORM
        ====================================== */}

        <View style={styles.form}>
          {/* EMAIL */}

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={[
              styles.input,

              errorMessage &&
                styles.inputError,

              isDesktop &&
                styles.inputDesktop,
            ]}
            placeholder="you@email.com"
            placeholderTextColor="#A48B7F"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={
              handleEmailChange
            }
            editable={!loading}
            returnKeyType="next"
          />

          {/* PASSWORD */}

          <Text style={styles.label}>
            Password
          </Text>

          <View
            style={[
              styles.passwordContainer,

              errorMessage &&
                styles.passwordContainerError,
            ]}
          >
            <TextInput
              style={[
                styles.passwordInput,

                isDesktop &&
                  styles.passwordInputDesktop,
              ]}
              placeholder="Your password"
              placeholderTextColor="#A48B7F"
              secureTextEntry={
                !showPassword
              }
              value={password}
              onChangeText={
                handlePasswordChange
              }
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={
                handleLogin
              }
            />

            {/* SHOW / HIDE PASSWORD */}

            <Pressable
              style={({ pressed }) => [
                styles.eyeButton,

                pressed &&
                  styles.eyeButtonPressed,
              ]}
              onPress={() =>
                setShowPassword(
                  (current) =>
                    !current
                )
              }
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              <Ionicons
                    name={
                      showPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={22}
                    color="#76594F"
                  />
                </Pressable>
              </View>
              <Pressable
      onPress={() =>
        router.push("/forgot-password")
      }
    >
      <Text style={styles.forgotPassword}>
        Forgot password?
      </Text>
    </Pressable>

          {/* ======================================
              ERROR MESSAGE
          ====================================== */}

          {errorMessage ? (
            <View
              style={
                styles.errorContainer
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color="#B42318"
              />

              <Text
                style={
                  styles.errorText
                }
              >
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* ======================================
              SIGN IN
          ====================================== */}

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
            <Text
              style={
                styles.buttonText
              }
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </Text>
          </Pressable>

          {/* ======================================
              CREATE ACCOUNT
          ====================================== */}

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

              <Text
                style={
                  styles.linkStrong
                }
              >
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

const styles =
  StyleSheet.create({
    // ======================================
    // PAGE
    // ======================================

    screen: {
      flex: 1,

      backgroundColor:
        "#FFF9F5",

      alignItems:
        "center",
    },
    forgotPassword: {
      alignSelf: "flex-end",
      color: "#6F4E37",
      fontSize: 14,
      fontWeight: "600",
      marginTop: -4,
    },

    container: {
      flex: 1,

      width:
        "100%",

      paddingHorizontal:
        24,

      paddingTop:
        90,

      paddingBottom:
        40,
    },

    containerSmall: {
      paddingHorizontal:
        18,

      paddingTop:
        70,
    },

    // ======================================
    // TABLET
    // ======================================

    containerTablet: {
      width:
        "100%",

      maxWidth:
        680,

      paddingHorizontal:
        36,
    },

    // ======================================
    // DESKTOP
    // ======================================

    containerDesktop: {
      width:
        "100%",

      maxWidth:
        560,

      paddingHorizontal:
        24,

      paddingTop:
        50,

      paddingBottom:
        50,

      justifyContent:
        "center",
    },

    // ======================================
    // BRAND / LOGO
    // ======================================

    logo: {
      width:
        80,

      height:
        80,
    },

    logoSmall: {
      width:
        70,

      height:
        70,
    },

    logoDesktop: {
      width:
        85,

      height:
        85,
    },

    title: {
      fontSize:
        32,

      fontWeight:
        "700",

      color:
        "#3B241C",

      marginTop:
        16,

      letterSpacing:
        -0.4,
    },

    titleSmall: {
      fontSize:
        28,
    },

    titleDesktop: {
      fontSize:
        34,
    },

    subtitle: {
      fontSize:
        16,

      color:
        "#76594F",

      marginTop:
        8,

      marginBottom:
        30,

      lineHeight:
        22,
    },

    subtitleSmall: {
      fontSize:
        15,

      marginBottom:
        26,
    },

    // ======================================
    // FORM
    // ======================================

    form: {
      width:
        "100%",

      gap:
        12,
    },

    label: {
      fontSize:
        15,

      fontWeight:
        "600",

      color:
        "#3B241C",

      marginTop:
        4,
    },

    // ======================================
    // EMAIL INPUT
    // ======================================

    input: {
      width:
        "100%",

      minHeight:
        52,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E8DDD7",

      borderRadius:
        14,

      paddingHorizontal:
        16,

      paddingVertical:
        14,

      fontSize:
        16,

      color:
        "#3B241C",
    },

    inputDesktop: {
      minHeight:
        54,
    },

    inputError: {
      borderColor:
        "#D92D20",
    },

    // ======================================
    // PASSWORD
    // ======================================

    passwordContainer: {
      width:
        "100%",

      minHeight:
        52,

      position:
        "relative",

      justifyContent:
        "center",

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E8DDD7",

      borderRadius:
        14,
    },

    passwordContainerError: {
      borderColor:
        "#D92D20",
    },

    passwordInput: {
      width:
        "100%",

      minHeight:
        52,

      borderWidth:
        0,

      backgroundColor:
        "transparent",

      paddingLeft:
        16,

      paddingRight:
        55,

      paddingVertical:
        14,

      fontSize:
        16,

      color:
        "#3B241C",

      outlineStyle:
        "none",
    } as any,

    passwordInputDesktop: {
      minHeight:
        54,
    },

    // ======================================
    // EYE BUTTON
    // ======================================

    eyeButton: {
      position:
        "absolute",

      right:
        10,

      top:
        0,

      bottom:
        0,

      width:
        44,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    eyeButtonPressed: {
      opacity:
        0.55,
    },

    // ======================================
    // ERROR
    // ======================================

    errorContainer: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,

      paddingHorizontal:
        4,

      marginTop:
        0,
    },

    errorText: {
      flex:
        1,

      color:
        "#B42318",

      fontSize:
        14,

      fontWeight:
        "500",

      lineHeight:
        20,
    },

    // ======================================
    // SIGN IN BUTTON
    // ======================================

    button: {
      width:
        "100%",

      minHeight:
        54,

      backgroundColor:
        "#6F4E37",

      borderRadius:
        28,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop:
        10,

      shadowColor:
        "#3B241C",

      shadowOffset: {
        width:
          0,

        height:
          3,
      },

      shadowOpacity:
        0.12,

      shadowRadius:
        6,

      elevation:
        3,
    },

    buttonPressed: {
      opacity:
        0.88,
    },

    buttonDisabled: {
      opacity:
        0.6,
    },

    buttonText: {
      color:
        "#FFFFFF",

      fontSize:
        17,

      fontWeight:
        "700",
    },

    // ======================================
    // SIGN UP
    // ======================================

    linkButton: {
      alignSelf:
        "center",

      paddingHorizontal:
        8,

      paddingVertical:
        8,

      marginTop:
        6,
    },

    linkPressed: {
      opacity:
        0.65,
    },

    link: {
      color:
        "#76594F",

      textAlign:
        "center",

      fontSize:
        15,

      fontWeight:
        "500",
    },

    linkStrong: {
      color:
        "#6F4E37",

      fontWeight:
        "700",
    },
    
  });