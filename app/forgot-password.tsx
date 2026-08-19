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

export default function ForgotPasswordScreen() {
  // ==========================================
  // STATE
  // ==========================================

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // ==========================================
  // RESPONSIVE
  // ==========================================

  const { width } = useWindowDimensions();

  const isSmallMobile = width < 380;
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;

  // ==========================================
  // SEND RESET EMAIL
  // ==========================================

  const handleResetPassword = async () => {
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage(
        "Please enter your email address."
      );

      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo:
              "https://cuptogether.expo.app/reset-password",
          }
        );

      if (error) {
        console.error(
          "Password reset error:",
          error.message
        );

        setErrorMessage(
          "Unable to send the reset email. Please try again."
        );

        return;
      }

      setSuccess(true);
    } catch (error) {
      console.error(
        "Unexpected password reset error:",
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

  const handleEmailChange = (text: string) => {
    setEmail(text);

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ==========================================
  // SUCCESS SCREEN
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

          <View style={styles.successIcon}>
            <Ionicons
              name="mail-outline"
              size={34}
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
            Check your email
          </Text>

          <Text style={styles.subtitle}>
            If an account exists for{" "}
            <Text style={styles.emailStrong}>
              {email.trim()}
            </Text>
            , we sent a link to reset your password.
          </Text>

          <Text style={styles.helpText}>
            Check your inbox and spam folder. The
            link in the email will take you back to
            CupTogether to create a new password.
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
            <Text style={styles.buttonText}>
              Back to Sign In
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.resendButton,

              pressed &&
                styles.linkPressed,
            ]}
            onPress={() => {
              setSuccess(false);
              setErrorMessage("");
            }}
          >
            <Text style={styles.resendText}>
              Didn't receive an email?{" "}
              <Text style={styles.linkStrong}>
                Try again
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ==========================================
  // FORM SCREEN
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
          Forgot password?
        </Text>

        <Text
          style={[
            styles.subtitle,

            isSmallMobile &&
              styles.subtitleSmall,
          ]}
        >
          No worries. Enter the email associated
          with your CupTogether account and we'll
          send you a password reset link.
        </Text>

        {/* FORM */}

        <View style={styles.form}>
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
            onChangeText={handleEmailChange}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={
              handleResetPassword
            }
          />

          {/* ERROR */}

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color="#B42318"
              />

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* RESET BUTTON */}

          <Pressable
            style={({ pressed }) => [
              styles.button,

              pressed &&
                !loading &&
                styles.buttonPressed,

              loading &&
                styles.buttonDisabled,
            ]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Sending..."
                : "Send Reset Link"}
            </Text>
          </Pressable>

          {/* BACK TO LOGIN */}

          <Pressable
            style={({ pressed }) => [
              styles.linkButton,

              pressed &&
                styles.linkPressed,
            ]}
            onPress={() =>
              router.replace("/login")
            }
            disabled={loading}
          >
            <View style={styles.backRow}>
              <Ionicons
                name="arrow-back"
                size={17}
                color="#6F4E37"
              />

              <Text style={styles.link}>
                Back to Sign In
              </Text>
            </View>
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

  emailStrong: {
    color: "#3B241C",
    fontWeight: "700",
  },

  helpText: {
    fontSize: 14,
    color: "#A48B7F",
    lineHeight: 21,
    marginTop: -14,
    marginBottom: 8,
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

  inputError: {
    borderColor: "#D92D20",
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
  // BACK LINK
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

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  link: {
    color: "#6F4E37",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
  },

  linkStrong: {
    color: "#6F4E37",
    fontWeight: "700",
  },

  // ======================================
  // SUCCESS
  // ======================================

  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3E9E3",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  resendButton: {
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginTop: 4,
  },

  resendText: {
    color: "#76594F",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
});