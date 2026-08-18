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

export default function SignupScreen() {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const { width } =
    useWindowDimensions();

  const isSmallMobile =
    width < 380;

  const isTablet =
    width >= 768;

  const isDesktop =
    width >= 1024;

  const handleSignup = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      Alert.alert(
        "Missing information",
        "Please complete all fields."
      );

      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password too short",
        "Your password must be at least 6 characters long."
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email:
            email.trim(),

          password,

          options: {
            data: {
              name:
                name.trim(),
            },
          },
        });

      if (error) {
        throw error;
      }

      const user = data.user;

      if (!user) {
        throw new Error(
          "User was not created."
        );
      }

      if (data.session) {
        const {
          error:
            profileError,
        } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            name:
              name.trim(),
            avatar_url:
              null,
            bio: null,
          });

        if (
          profileError
        ) {
          throw profileError;
        }

        router.replace(
          "/(tabs)"
        );

        return;
      }

      Alert.alert(
        "Check your email",
        "Your account was created. Please confirm your email before signing in."
      );

      router.replace(
        "/login"
      );
    } catch (
      error: any
    ) {
      Alert.alert(
        "Signup failed",
        error.message ??
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

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
          ]}
          resizeMode="contain"
        />

        {/* TITLE */}

        <Text
          style={[
            styles.title,

            isSmallMobile &&
              styles.titleSmall,
          ]}
        >
          Join CupTogether
        </Text>

        {/* SUBTITLE */}

        <Text
          style={[
            styles.subtitle,

            isSmallMobile &&
              styles.subtitleSmall,
          ]}
        >
          Create your account and start sharing coffee finds.
        </Text>

        {/* FORM */}

        <View
          style={
            styles.form
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Name
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Your name"
            placeholderTextColor="#A48B7F"
            value={name}
            onChangeText={
              setName
            }
            editable={
              !loading
            }
          />

          <Text
            style={
              styles.label
            }
          >
            Email
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="you@email.com"
            placeholderTextColor="#A48B7F"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={
              false
            }
            value={email}
            onChangeText={
              setEmail
            }
            editable={
              !loading
            }
          />

          <Text
            style={
              styles.label
            }
          >
            Password
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Minimum 6 characters"
            placeholderTextColor="#A48B7F"
            secureTextEntry
            value={
              password
            }
            onChangeText={
              setPassword
            }
            editable={
              !loading
            }
          />

          <Pressable
            style={[
              styles.button,

              loading &&
                styles.buttonDisabled,
            ]}
            onPress={
              handleSignup
            }
            disabled={
              loading
            }
          >
            <Text
              style={
                styles.buttonText
              }
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                "/login"
              )
            }
            disabled={
              loading
            }
          >
            <Text
              style={
                styles.link
              }
            >
              Already have an account? Sign in
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        "#FFF9F5",

      alignItems: "center",
    },

    container: {
      flex: 1,

      width: "100%",

      paddingHorizontal: 24,
      paddingTop: 70,
      paddingBottom: 40,
    },

    containerSmall: {
      paddingHorizontal: 18,
      paddingTop: 55,
    },

    containerTablet: {
      maxWidth: 680,
      paddingHorizontal: 32,
    },

    containerDesktop: {
      maxWidth: 560,

      paddingHorizontal: 24,
      paddingTop: 50,

      justifyContent:
        "center",
    },

    // LOGO

    logo: {
      width: 70,
      height: 70,

      alignSelf:
        "flex-start",

      resizeMode:
        "contain",
    },

    logoSmall: {
      width: 58,
      height: 58,
    },

    // TITLE

    title: {
      fontSize: 32,

      fontWeight: "700",

      color: "#3B241C",

      marginTop: 16,
    },

    titleSmall: {
      fontSize: 28,
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

      marginBottom: 24,
    },

    // FORM

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

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#E8DDD7",

      borderRadius: 14,

      paddingHorizontal: 16,

      paddingVertical: 14,

      fontSize: 16,

      color: "#3B241C",
    },

    // BUTTON

    button: {
      width: "100%",

      minHeight: 54,

      backgroundColor:
        "#6F4E37",

      borderRadius: 30,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 16,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color: "#FFFFFF",

      fontSize: 17,

      fontWeight: "600",
    },

    // LOGIN LINK

    link: {
      color: "#6F4E37",

      textAlign:
        "center",

      fontSize: 15,

      marginTop: 12,

      fontWeight: "600",
    },
  });