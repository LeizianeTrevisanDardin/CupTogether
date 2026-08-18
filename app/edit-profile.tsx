import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { router } from "expo-router";

import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function EditProfileScreen() {
  const { user } = useAuth();

  const { width } =
    useWindowDimensions();

  const isSmallMobile =
    width < 380;

  const isTablet =
    width >= 768;

  const isDesktop =
    width >= 1024;

  const [name, setName] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [
    avatarUrl,
    setAvatarUrl,
  ] =
    useState<string | null>(
      null
    );

  const [
    selectedAvatarUri,
    setSelectedAvatarUri,
  ] =
    useState<string | null>(
      null
    );

  const [
    selectedAvatarMimeType,
    setSelectedAvatarMimeType,
  ] =
    useState<string | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {
    const loadProfile =
      async () => {
        if (!user) {
          setLoading(false);
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("profiles")
          .select(
            "name, bio, avatar_url"
          )
          .eq(
            "id",
            user.id
          )
          .single();

        if (error) {
          Alert.alert(
            "Profile error",
            error.message
          );

          setLoading(false);
          return;
        }

        setName(
          data.name ?? ""
        );

        setBio(
          data.bio ?? ""
        );

        setAvatarUrl(
          data.avatar_url ??
            null
        );

        setLoading(false);
      };

    loadProfile();
  }, [user]);

  // ==========================================
  // CHOOSE AVATAR
  // ==========================================

  const handleChooseAvatar =
    async () => {
      const permission =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          "Permission required",
          "CupTogether needs permission to access your photos."
        );

        return;
      }

      const result =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes: [
              "images",
            ],
            allowsEditing:
              true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (
        result.canceled
      ) {
        return;
      }

      const selectedImage =
        result.assets[0];

      setSelectedAvatarUri(
        selectedImage.uri
      );

      setSelectedAvatarMimeType(
        selectedImage.mimeType ??
          "image/jpeg"
      );
    };

  // ==========================================
  // UPLOAD AVATAR
  // ==========================================

  const uploadAvatar =
    async () => {
      if (
        !user ||
        !selectedAvatarUri
      ) {
        return avatarUrl;
      }

      const response =
        await fetch(
          selectedAvatarUri
        );

      const arrayBuffer =
        await response
          .arrayBuffer();

      const mimeType =
        selectedAvatarMimeType ??
        "image/jpeg";

      const extension =
        mimeType ===
        "image/png"
          ? "png"
          : mimeType ===
            "image/webp"
          ? "webp"
          : "jpg";

      const filePath =
        `${user.id}/avatar-${Date.now()}.${extension}`;

      const {
        error: uploadError,
      } =
        await supabase
          .storage
          .from("avatars")
          .upload(
            filePath,
            arrayBuffer,
            {
              contentType:
                mimeType,
              upsert: false,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(
            filePath
          );

      return (
        publicUrlData
          .publicUrl
      );
    };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSave =
    async () => {
      if (!user) {
        Alert.alert(
          "Not signed in",
          "Please sign in again."
        );

        return;
      }

      if (
        !name.trim()
      ) {
        Alert.alert(
          "Missing name",
          "Please enter your name."
        );

        return;
      }

      try {
        setSaving(true);

        let finalAvatarUrl =
          avatarUrl;

        if (
          selectedAvatarUri
        ) {
          finalAvatarUrl =
            await uploadAvatar();
        }

        const {
          data,
          error,
        } =
          await supabase
            .from("profiles")
            .update({
              name:
                name.trim(),

              bio:
                bio.trim() ||
                null,

              avatar_url:
                finalAvatarUrl,
            })
            .eq(
              "id",
              user.id
            )
            .select("id")
            .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "Profile was not updated."
          );
        }

        setAvatarUrl(
          finalAvatarUrl
        );

        setSelectedAvatarUri(
          null
        );

        setSelectedAvatarMimeType(
          null
        );

        Alert.alert(
          "Profile updated",
          "Your profile was saved successfully."
        );

        router.back();
      } catch (
        error: unknown
      ) {
        console.error(
          "Error updating profile:",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong.";

        Alert.alert(
          "Update failed",
          message
        );
      } finally {
        setSaving(false);
      }
    };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#6F4E37"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  const previewAvatar =
    selectedAvatarUri ??
    avatarUrl;

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
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
          {/* HEADER */}

          <Text
            style={[
              styles.title,

              isSmallMobile &&
                styles.titleSmall,
            ]}
          >
            Edit Profile
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Make your CupTogether profile yours.
          </Text>

          {/* AVATAR */}

          <View
            style={
              styles.avatarSection
            }
          >
            {previewAvatar ? (
              <Image
                source={{
                  uri:
                    previewAvatar,
                }}
                style={
                  styles.avatar
                }
                resizeMode="cover"
              />
            ) : (
              <View
                style={
                  styles.avatarPlaceholder
                }
              >
                <Text
                  style={
                    styles.avatarInitial
                  }
                >
                  {name
                    ? name
                        .charAt(0)
                        .toUpperCase()
                    : "C"}
                </Text>
              </View>
            )}

            <Pressable
              style={
                styles.changePhotoButton
              }
              onPress={
                handleChooseAvatar
              }
              disabled={
                saving
              }
            >
              <Text
                style={
                  styles.changePhotoText
                }
              >
                Change Photo
              </Text>
            </Pressable>
          </View>

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
              style={[
                styles.input,
                {
                  outlineStyle:
                    "none",
                } as any,
              ]}
              placeholder="Your name"
              placeholderTextColor="#A48B7F"
              value={name}
              onChangeText={
                setName
              }
            />

            <Text
              style={
                styles.label
              }
            >
              Bio
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  outlineStyle:
                    "none",
                } as any,
              ]}
              placeholder="Coffee lover, latte explorer..."
              placeholderTextColor="#A48B7F"
              value={bio}
              onChangeText={
                setBio
              }
              multiline
              textAlignVertical="top"
              maxLength={160}
            />

            <Text
              style={
                styles.counter
              }
            >
              {bio.length}/160
            </Text>

            <Pressable
              style={[
                styles.saveButton,

                saving &&
                  styles.buttonDisabled,
              ]}
              onPress={
                handleSave
              }
              disabled={
                saving
              }
            >
              {saving ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Save Profile
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() =>
                router.back()
              }
              disabled={
                saving
              }
            >
              <Text
                style={
                  styles.cancel
                }
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    // ======================================
    // LOADING
    // ======================================

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#FFF9F5",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color:
        "#76594F",
    },

    // ======================================
    // PAGE
    // ======================================

    screen: {
      flex: 1,
      backgroundColor:
        "#FFF9F5",
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      alignItems:
        "center",
      paddingBottom: 60,
    },

    container: {
      width: "100%",
      paddingHorizontal:
        24,
      paddingTop: 70,
    },

    containerSmall: {
      paddingHorizontal:
        18,
      paddingTop: 50,
    },

    containerTablet: {
      maxWidth: 760,
    },

    containerDesktop: {
      maxWidth: 720,
      paddingHorizontal:
        28,
      paddingTop: 55,
    },

    // ======================================
    // HEADER
    // ======================================

    title: {
      fontSize: 30,
      fontWeight:
        "700",
      color:
        "#3B241C",
    },

    titleSmall: {
      fontSize: 27,
    },

    subtitle: {
      fontSize: 16,
      color:
        "#76594F",
      marginTop: 8,
      marginBottom: 26,
    },

    // ======================================
    // AVATAR
    // ======================================

    avatarSection: {
      alignItems:
        "center",
      marginBottom: 30,
    },

    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor:
        "#F1E4DC",
    },

    avatarPlaceholder: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor:
        "#6F4E37",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    avatarInitial: {
      color:
        "#FFFFFF",
      fontSize: 42,
      fontWeight:
        "700",
    },

    changePhotoButton: {
      marginTop: 12,
    },

    changePhotoText: {
      color:
        "#6F4E37",
      fontSize: 15,
      fontWeight:
        "600",
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
      fontWeight:
        "600",
      color:
        "#3B241C",
    },

    input: {
      width: "100%",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E8DDD7",
      borderRadius: 14,
      paddingHorizontal:
        16,
      paddingVertical:
        14,
      fontSize: 16,
      color:
        "#3B241C",
    },

    textArea: {
      height: 110,
      textAlignVertical:
        "top",
    },

    counter: {
      textAlign:
        "right",
      fontSize: 13,
      color:
        "#A48B7F",
    },

    // ======================================
    // BUTTONS
    // ======================================

    saveButton: {
      backgroundColor:
        "#6F4E37",
      paddingVertical:
        16,
      borderRadius: 30,
      alignItems:
        "center",
      marginTop: 8,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    saveButtonText: {
      color:
        "#FFFFFF",
      fontSize: 17,
      fontWeight:
        "600",
    },

    cancel: {
      textAlign:
        "center",
      color:
        "#76594F",
      fontSize: 15,
      fontWeight:
        "600",
      marginTop: 8,
    },
  });