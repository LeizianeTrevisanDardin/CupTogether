import { useEffect, useState } from "react";

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

export default function ResetPasswordScreen() {
  // ==========================================
  // STATE
  // ==========================================

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [recoveryReady, setRecoveryReady] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

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
  // PASSWORD RECOVERY SESSION
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (
        mounted &&
        session
      ) {
        setRecoveryReady(true);
      }

      if (mounted) {
        setCheckingSession(false);
      }
    };

    checkSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (
            event ===
              "PASSWORD_RECOVERY" &&
            session
          ) {
            setRecoveryReady(true);
            setCheckingSession(false);
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ==========================================
  // UPDATE PASSWORD
  // ==========================================

  const handleUpdatePassword =
    async () => {
      setErrorMessage("");

      if (
        !password ||
        !confirmPassword
      ) {
        setErrorMessage(
          "Please enter and confirm your new password."
        );

        return;
      }

      if (password.length < 8) {
        setErrorMessage(
          "Password must be at least 8 characters long."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          "Passwords do not match."
        );

        return;
      }

      try {
        setLoading(true);

        const { error } =
          await supabase.auth.updateUser({
            password,
          });

        if (error) {
          console.error(
            "Password update error:",
            error.message
          );

          setErrorMessage(
            "Unable to update your password. Please request a new reset link and try again."
          );

          return;
        }

        setSuccess(true);
      } catch (error) {
        console.error(
          "Unexpected password update error:",
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
  // PASSWORD CHANGE
  // ==========================================

  const handlePasswordChange = (
    text: string
  ) => {
    setPassword(text);

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleConfirmPasswordChange = (
    text: string
  ) => {
    setConfirmPassword(text);

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ==========================================
  // LOADING SESSION
  // ==========================================

  if (checkingSession) {
    return (
      <View
        style={[
          styles.screen,
          styles.centered,
        ]}
      >
        <Image
          source={require(
            "@/assets/images/CupIconApp.png"
          )}
          style={styles.loadingLogo}
          resizeMode="contain"
        />

        <Text style={styles.loadingText}>
          Preparing password reset...
        </Text>
      </View>
    );
  }

  // ==========================================
  // INVALID / EXPIRED LINK
  // ==========================================

  if (!recoveryReady) {
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

          <View
            style={
              styles.statusIcon
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color="#B42318"
            />
          </View>

          <Text
            style={[
              styles.title,

              isSmallMobile &&
                styles.titleSmall,

              isDesktop &&
                styles.titleDesktop,
            ]}
          >
            Reset link unavailable
          </Text>

          <Text style={styles.subtitle}>
            This password reset link may
            be invalid or expired. Request
            a new link and try again.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,

              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() =>
              router.replace(
                "/forgot-password"
              )
            }
          >
            <Text
              style={
                styles.buttonText
              }
            >
              Request New Link
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.linkButton,

              pressed &&
                styles.linkPressed,
            ]}
            onPress={() =>
              router.replace("/login")
            }
          >
            <Text style={styles.link}>
              Back to Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ==========================================
  // SUCCESS
  // ==========================================

  if (success) {
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

          <View
            style={
              styles.successIcon
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={38}
              color="#6F4E37"
            />
          </View>

          <Text
            style={[
              styles.title,

              isSmallMobile &&
                styles.titleSmall,

              isDesktop &&
                styles.titleDesktop,
            ]}
          >
            Password updated
          </Text>

          <Text style={styles.subtitle}>
            Your password has been changed
            successfully. You can now sign
            in using your new password.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,

              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() =>
              router.replace("/login")
            }
          >
            <Text
              style={
                styles.buttonText
              }
            >
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ==========================================
  // RESET FORM
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
        {/* LOGO */}

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

        {/* TITLE */}

        <Text
          style={[
            styles.title,

            isSmallMobile &&
              styles.titleSmall,

            isDesktop &&
              styles.titleDesktop,
          ]}
        >
          Create new password
        </Text>

        <Text
          style={[
            styles.subtitle,

            isSmallMobile &&
              styles.subtitleSmall,
          ]}
        >
          Choose a new password for your
          CupTogether account.
        </Text>

        {/* FORM */}

        <View style={styles.form}>
          <Text style={styles.label}>
            New password
          </Text>

          <View
            style={[
              styles.passwordContainer,

              errorMessage &&
                styles.passwordContainerError,
            ]}
          >
            <TextInput
              style={
                styles.passwordInput
              }
              placeholder="New password"
              placeholderTextColor="#A48B7F"
              secureTextEntry={
                !showPassword
              }
              value={password}
              onChangeText={
                handlePasswordChange
              }
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

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

          <Text style={styles.label}>
            Confirm password
          </Text>

          <View
            style={[
              styles.passwordContainer,

              errorMessage &&
                styles.passwordContainerError,
            ]}
          >
            <TextInput
              style={
                styles.passwordInput
              }
              placeholder="Confirm new password"
              placeholderTextColor="#A48B7F"
              secureTextEntry={
                !showConfirmPassword
              }
              value={
                confirmPassword
              }
              onChangeText={
                handleConfirmPasswordChange
              }
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={
                handleUpdatePassword
              }
            />

            <Pressable
              style={({ pressed }) => [
                styles.eyeButton,

                pressed &&
                  styles.eyeButtonPressed,
              ]}
              onPress={() =>
                setShowConfirmPassword(
                  (current) =>
                    !current
                )
              }
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={
                showConfirmPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={22}
                color="#76594F"
              />
            </Pressable>
          </View>

          {/* ERROR */}

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

          {/* UPDATE BUTTON */}

          <Pressable
            style={({ pressed }) => [
              styles.button,

              pressed &&
                !loading &&
                styles.buttonPressed,

              loading &&
                styles.buttonDisabled,
            ]}
            onPress={
              handleUpdatePassword
            }
            disabled={loading}
          >
            <Text
              style={
                styles.buttonText
              }
            >
              {loading
                ? "Updating..."
                : "Update Password"}
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
    screen: {
      flex: 1,
      backgroundColor: "#FFF9F5",
      alignItems: "center",
    },

    centered: {
      justifyContent: "center",
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

    containerTablet: {
      width: "100%",
      maxWidth: 680,
      paddingHorizontal: 36,
    },

    containerDesktop: {
      width: "100%",
      maxWidth: 560,
      paddingHorizontal: 24,
      paddingTop: 50,
      paddingBottom: 50,
      justifyContent: "center",
    },

    // ======================================
    // LOGO
    // ======================================

    logo: {
      width: 80,
      height: 80,
    },

    logoSmall: {
      width: 70,
      height: 70,
    },

    logoDesktop: {
      width: 85,
      height: 85,
    },

    loadingLogo: {
      width: 70,
      height: 70,
      marginBottom: 12,
    },

    loadingText: {
      color: "#76594F",
      fontSize: 15,
      fontWeight: "600",
    },

    // ======================================
    // TEXT
    // ======================================

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
      lineHeight: 23,
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

    // ======================================
    // PASSWORD INPUTS
    // ======================================

    passwordContainer: {
      width: "100%",
      minHeight: 52,
      position: "relative",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E8DDD7",
      borderRadius: 14,
    },

    passwordContainerError: {
      borderColor: "#D92D20",
    },

    passwordInput: {
      width: "100%",
      minHeight: 52,
      borderWidth: 0,
      backgroundColor: "transparent",
      paddingLeft: 16,
      paddingRight: 55,
      paddingVertical: 14,
      fontSize: 16,
      color: "#3B241C",

      outlineStyle: "none",
    } as any,

    // ======================================
    // EYE BUTTON
    // ======================================

    eyeButton: {
      position: "absolute",
      right: 10,
      top: 0,
      bottom: 0,
      width: 44,
      justifyContent: "center",
      alignItems: "center",
    },

    eyeButtonPressed: {
      opacity: 0.55,
    },

    // ======================================
    // ERROR
    // ======================================

    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 4,
    },

    errorText: {
      flex: 1,
      color: "#B42318",
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
    },

    // ======================================
    // BUTTON
    // ======================================

    button: {
      width: "100%",
      minHeight: 54,
      backgroundColor: "#6F4E37",
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,

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
    // LINK
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
      color: "#6F4E37",
      textAlign: "center",
      fontSize: 15,
      fontWeight: "600",
    },

    // ======================================
    // STATUS ICON
    // ======================================

    statusIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#FFF0EE",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 22,
    },

    successIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#F3E9E3",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 22,
    },
  });