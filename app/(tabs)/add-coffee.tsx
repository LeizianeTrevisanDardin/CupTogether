import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

import { decode } from "base64-arraybuffer";

import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { useCoffee } from "@/context/CoffeeContext";
import { supabase } from "@/lib/supabase";

// ==========================================
// TYPES
// ==========================================

type UserGroup = {
  id: string;
  name: string;
};

export default function AddCoffeeScreen() {
  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  const isDesktop =
    width >= 1024;

  const { addCoffee } =
    useCoffee();

  const { user } =
    useAuth();

  // ==========================================
  // FORM
  // ==========================================

  const [
    coffeeShop,
    setCoffeeShop,
  ] = useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    latitude,
    setLatitude,
  ] =
    useState<
      number | undefined
    >();

  const [
    longitude,
    setLongitude,
  ] =
    useState<
      number | undefined
    >();

  const [
    order,
    setOrder,
  ] = useState("");

  const [
    rating,
    setRating,
  ] = useState(0);

  const [
    thoughts,
    setThoughts,
  ] = useState("");

  // ==========================================
  // PHOTO
  // ==========================================

  const [
    imageUri,
    setImageUri,
  ] =
    useState<
      string | null
    >(null);

  const [
    imageBase64,
    setImageBase64,
  ] =
    useState<
      string | null
    >(null);

  const [
    imageMimeType,
    setImageMimeType,
  ] =
    useState<string>(
      "image/jpeg"
    );

  // ==========================================
  // SHARE WITH
  // ==========================================

  const [
    userGroups,
    setUserGroups,
  ] =
    useState<
      UserGroup[]
    >([]);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] =
    useState<
      string | null
    >(null);

  const [
    loadingGroups,
    setLoadingGroups,
  ] = useState(false);

  // ==========================================
  // LOADING
  // ==========================================

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingLocation,
    setLoadingLocation,
  ] = useState(false);

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  // ==========================================
  // LOAD USER GROUPS
  // ==========================================

  useEffect(() => {
    const loadUserGroups =
      async () => {
        if (!user) {
          setUserGroups([]);
          return;
        }

        try {
          setLoadingGroups(
            true
          );

          // Find the groups this user belongs to

          const {
            data:
              membershipData,
            error:
              membershipError,
          } =
            await supabase
              .from(
                "group_members"
              )
              .select(
                "group_id"
              )
              .eq(
                "user_id",
                user.id
              );

          if (
            membershipError
          ) {
            throw membershipError;
          }

          const groupIds =
            (
              membershipData ??
              []
            )
              .map(
                (membership) =>
                  membership.group_id
              )
              .filter(Boolean);

          if (
            groupIds.length ===
            0
          ) {
            setUserGroups(
              []
            );

            return;
          }

          // Load group names

          const {
            data:
              groupData,
            error:
              groupError,
          } =
            await supabase
              .from("groups")
              .select(
                "id, name"
              )
              .in(
                "id",
                groupIds
              )
              .order(
                "name",
                {
                  ascending:
                    true,
                }
              );

          if (
            groupError
          ) {
            throw groupError;
          }

          setUserGroups(
            (
              groupData ??
              []
            ) as UserGroup[]
          );
        } catch (
          error
        ) {
          console.error(
            "Error loading groups:",
            error
          );

          setUserGroups(
            []
          );
        } finally {
          setLoadingGroups(
            false
          );
        }
      };

    loadUserGroups();
  }, [user]);

  // ==========================================
  // LOCATION
  // ==========================================

  const handleCurrentLocation =
    async () => {
      try {
        setLoadingLocation(
          true
        );

        const {
          status,
        } =
          await Location
            .requestForegroundPermissionsAsync();

        if (
          status !==
          "granted"
        ) {
          Alert.alert(
            "Location permission",
            "Please allow location access."
          );

          return;
        }

        const currentLocation =
          await Location
            .getCurrentPositionAsync(
              {
                accuracy:
                  Location
                    .Accuracy
                    .Balanced,
              }
            );

        const currentLatitude =
          currentLocation
            .coords
            .latitude;

        const currentLongitude =
          currentLocation
            .coords
            .longitude;

        setLatitude(
          currentLatitude
        );

        setLongitude(
          currentLongitude
        );

        const addresses =
          await Location
            .reverseGeocodeAsync(
              {
                latitude:
                  currentLatitude,

                longitude:
                  currentLongitude,
              }
            );

        const address =
          addresses[0];

        if (address) {
          const parts = [
            address.streetNumber,
            address.street,
            address.city,
            address.region,
            address.postalCode,
          ].filter(Boolean);

          setLocation(
            parts.join(", ")
          );
        } else {
          setLocation(
            `${currentLatitude.toFixed(
              6
            )}, ${currentLongitude.toFixed(
              6
            )}`
          );
        }
      } catch (error) {
        console.error(
          "Location error:",
          error
        );

        Alert.alert(
          "Location Error",
          "Could not get your current location."
        );
      } finally {
        setLoadingLocation(
          false
        );
      }
    };

  // ==========================================
  // PICK PHOTO
  // ==========================================

  const handlePickPhoto =
    async () => {
      try {
        const permission =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          Alert.alert(
            "Photo permission",
            "Please allow photo library access."
          );

          return;
        }

        const result =
          await ImagePicker
            .launchImageLibraryAsync(
              {
                mediaTypes: [
                  "images",
                ],

                allowsEditing:
                  true,

                aspect: [
                  4,
                  3,
                ],

                quality: 0.8,

                base64:
                  true,
              }
            );

        if (
          result.canceled
        ) {
          return;
        }

        const asset =
          result.assets[0];

        setImageUri(
          asset.uri
        );

        setImageBase64(
          asset.base64 ??
            null
        );

        setImageMimeType(
          asset.mimeType ??
            "image/jpeg"
        );
      } catch (error) {
        console.error(
          "Image picker error:",
          error
        );

        Alert.alert(
          "Photo Error",
          "Could not select the photo."
        );
      }
    };

  // ==========================================
  // UPLOAD PHOTO
  // ==========================================

  const uploadPhoto =
    async () => {
      if (
        !imageBase64 ||
        !user
      ) {
        return undefined;
      }

      try {
        setUploadingImage(
          true
        );

        const extension =
          imageMimeType.includes(
            "png"
          )
            ? "png"
            : "jpg";

        const fileName =
          `${user.id}/${Date.now()}.${extension}`;

        const {
          error,
        } =
          await supabase
            .storage
            .from(
              "coffee-images"
            )
            .upload(
              fileName,
              decode(
                imageBase64
              ),
              {
                contentType:
                  imageMimeType,

                upsert:
                  false,
              }
            );

        if (error) {
          throw error;
        }

        const {
          data:
            publicUrlData,
        } =
          supabase.storage
            .from(
              "coffee-images"
            )
            .getPublicUrl(
              fileName
            );

        return (
          publicUrlData
            .publicUrl
        );
      } catch (error) {
        console.error(
          "Photo upload error:",
          error
        );

        throw error;
      } finally {
        setUploadingImage(
          false
        );
      }
    };

  // ==========================================
  // ADD COFFEE
  // ==========================================

  const handleAddCoffee =
    async () => {
      if (
        !coffeeShop.trim()
      ) {
        Alert.alert(
          "Missing Coffee Shop",
          "Please enter the name of the coffee shop."
        );

        return;
      }

      if (!user) {
        Alert.alert(
          "Not signed in",
          "Please sign in before adding a coffee."
        );

        return;
      }

      try {
        setLoading(true);

        let uploadedImageUrl:
          | string
          | undefined =
          undefined;

        if (
          imageBase64
        ) {
          uploadedImageUrl =
            await uploadPhoto();
        }

        await addCoffee({
          userId:
            user.id,

          userName:
            user
              .user_metadata
              ?.name ??
            "Coffee Friend",

          coffeeShop:
            coffeeShop.trim(),

          location:
            location.trim(),

          latitude,
          longitude,

          order:
            order.trim(),

          rating,

          thoughts:
            thoughts.trim(),

          imageUrl:
            uploadedImageUrl,

          // null = Everyone
          // id = selected group
          groupId:
            selectedGroupId,
        });

        // ======================================
        // RESET FORM
        // ======================================

        setCoffeeShop(
          ""
        );

        setLocation("");

        setLatitude(
          undefined
        );

        setLongitude(
          undefined
        );

        setOrder("");

        setRating(0);

        setThoughts("");

        setImageUri(
          null
        );

        setImageBase64(
          null
        );

        setSelectedGroupId(
          null
        );

        Keyboard.dismiss();

        router.navigate(
          "/(tabs)"
        );
      } catch (
        error: any
      ) {
        console.error(
          "Error adding coffee:",
          error
        );

        Alert.alert(
          "Something went wrong",
          error?.message ??
            "We could not save your coffee."
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS ===
        "ios"
          ? "padding"
          : "height"
      }
    >
      <ScrollView
        style={
          styles.scroll
        }
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
            styles.content,

            isTablet &&
              styles.contentTablet,

            isDesktop &&
              styles.contentDesktop,
          ]}
        >
          {/* LOGO */}

          <Image
            source={require(
              "@/assets/images/CupIconApp.png"
            )}
            style={
              styles.logo
            }
            resizeMode="contain"
          />

          <Text
            style={
              styles.title
            }
          >
            Add a Coffee Find
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Share your latest coffee
            spot with your friends!
          </Text>

          <View
            style={
              styles.form
            }
          >
            {/* ======================================
                COFFEE SHOP
            ====================================== */}

            <Text
              style={
                styles.label
              }
            >
              Coffee Shop Name
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Example: Analog Coffee"
              placeholderTextColor="#A48B7F"
              value={
                coffeeShop
              }
              onChangeText={
                setCoffeeShop
              }
            />

            {/* ======================================
                LOCATION
            ====================================== */}

            <Text
              style={
                styles.label
              }
            >
              Location
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Address or area"
              placeholderTextColor="#A48B7F"
              value={
                location
              }
              onChangeText={
                setLocation
              }
            />

            <Pressable
              style={[
                styles.locationButton,

                loadingLocation &&
                  styles.disabled,
              ]}
              disabled={
                loadingLocation
              }
              onPress={
                handleCurrentLocation
              }
            >
              <Text
                style={
                  styles.locationButtonText
                }
              >
                {loadingLocation
                  ? "📍 Finding Location..."
                  : "📍 Use Current Location"}
              </Text>
            </Pressable>

            {latitude !==
              undefined &&
            longitude !==
              undefined ? (
              <Text
                style={
                  styles.locationConfirmed
                }
              >
                ✓ Location saved
              </Text>
            ) : null}

            {/* ======================================
                PHOTO
            ====================================== */}

            <Text
              style={
                styles.label
              }
            >
              Photo
            </Text>

            {imageUri ? (
              <View
                style={
                  styles.imageContainer
                }
              >
                <Image
                  source={{
                    uri:
                      imageUri,
                  }}
                  style={
                    styles.previewImage
                  }
                />

                <View
                  style={
                    styles.imageActions
                  }
                >
                  <Pressable
                    style={
                      styles.changePhotoButton
                    }
                    onPress={
                      handlePickPhoto
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

                  <Pressable
                    style={
                      styles.removePhotoButton
                    }
                    onPress={() => {
                      setImageUri(
                        null
                      );

                      setImageBase64(
                        null
                      );
                    }}
                  >
                    <Text
                      style={
                        styles.removePhotoText
                      }
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={
                  styles.photoButton
                }
                onPress={
                  handlePickPhoto
                }
              >
                <Text
                  style={
                    styles.photoIcon
                  }
                >
                  📷
                </Text>

                <Text
                  style={
                    styles.photoTitle
                  }
                >
                  Add a coffee photo
                </Text>

                <Text
                  style={
                    styles.photoSubtitle
                  }
                >
                  Choose from your photo library
                </Text>
              </Pressable>
            )}

            {/* ======================================
                ORDER
            ====================================== */}

            <Text
              style={
                styles.label
              }
            >
              Order
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Latte, Cappuccino, Flat White..."
              placeholderTextColor="#A48B7F"
              value={order}
              onChangeText={
                setOrder
              }
            />

            {/* ======================================
                RATING
            ====================================== */}

            <Text
              style={
                styles.label
              }
            >
              Rating
            </Text>

            <View
              style={
                styles.ratingContainer
              }
            >
              {[
                1,
                2,
                3,
                4,
                5,
              ].map(
                (star) => (
                  <Pressable
                    key={
                      star
                    }
                    onPress={() =>
                      setRating(
                        star
                      )
                    }
                  >
                    <Text
                      style={
                        styles.star
                      }
                    >
                      {star <=
                      rating
                        ? "⭐️"
                        : "☆"}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            {/* ======================================
                THOUGHTS
            ====================================== */}

            <Text
              style={
                styles.label
              }
            >
              Thoughts
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Share your thoughts..."
              placeholderTextColor="#A48B7F"
              value={
                thoughts
              }
              onChangeText={
                setThoughts
              }
              multiline
              textAlignVertical="top"
            />

            {/* ======================================
                SHARE WITH
            ====================================== */}

            <Text
              style={[
                styles.label,
                styles.shareLabel,
              ]}
            >
              Share with
            </Text>

            <Text
              style={
                styles.shareDescription
              }
            >
              Choose who can see this
              Coffee Find.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.shareOptions
              }
            >
              {/* EVERYONE */}

              <Pressable
                style={[
                  styles.shareOption,

                  selectedGroupId ===
                    null &&
                    styles.shareOptionSelected,
                ]}
                onPress={() =>
                  setSelectedGroupId(
                    null
                  )
                }
              >
                <Text
                  style={[
                    styles.shareOptionText,

                    selectedGroupId ===
                      null &&
                      styles.shareOptionTextSelected,
                  ]}
                >
                  Everyone
                </Text>
              </Pressable>

              {/* GROUPS */}

              {userGroups.map(
                (group) => {
                  const selected =
                    selectedGroupId ===
                    group.id;

                  return (
                    <Pressable
                      key={
                        group.id
                      }
                      style={[
                        styles.shareOption,

                        selected &&
                          styles.shareOptionSelected,
                      ]}
                      onPress={() =>
                        setSelectedGroupId(
                          group.id
                        )
                      }
                    >
                      <Image
                        source={require(
                          "@/assets/images/PeopleLogo.png"
                        )}
                        style={
                          styles.shareGroupIcon
                        }
                        resizeMode="contain"
                      />

                      <Text
                        style={[
                          styles.shareOptionText,

                          selected &&
                            styles.shareOptionTextSelected,
                        ]}
                        numberOfLines={
                          1
                        }
                      >
                        {
                          group.name
                        }
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </ScrollView>

            {loadingGroups ? (
              <Text
                style={
                  styles.loadingGroupsText
                }
              >
                Loading your groups...
              </Text>
            ) : null}

            {!loadingGroups &&
            userGroups.length ===
              0 ? (
              <Text
                style={
                  styles.noGroupsText
                }
              >
                You are not in any groups
                yet. This Coffee Find will
                be shared with Everyone.
              </Text>
            ) : null}

            {/* ======================================
                SUBMIT
            ====================================== */}

            <Pressable
              style={[
                styles.button,

                (loading ||
                  uploadingImage) &&
                  styles.disabled,
              ]}
              disabled={
                loading ||
                uploadingImage
              }
              onPress={
                handleAddCoffee
              }
            >
              <Text
                style={
                  styles.buttonText
                }
              >
                {uploadingImage
                  ? "Uploading Photo..."
                  : loading
                  ? "Adding Coffee..."
                  : "Add Coffee Find"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles =
  StyleSheet.create({
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

      paddingHorizontal:
        24,

      paddingTop: 60,

      paddingBottom:
        140,
    },

    // ======================================
    // RESPONSIVE
    // ======================================

    content: {
      width: "100%",
    },

    contentTablet: {
      maxWidth: 760,
    },

    contentDesktop: {
      maxWidth: 720,
    },

    // ======================================
    // HEADER
    // ======================================

    logo: {
      width: 56,
      height: 56,
    },

    title: {
      fontSize: 28,

      fontWeight:
        "700",

      color:
        "#3B241C",

      marginTop: 10,
    },

    subtitle: {
      fontSize: 15,

      color:
        "#76594F",

      marginTop: 6,

      marginBottom: 24,
    },

    // ======================================
    // FORM
    // ======================================

    form: {
      gap: 10,
    },

    label: {
      fontSize: 15,

      color:
        "#3B241C",

      fontWeight:
        "600",

      marginTop: 8,
    },

    input: {
      backgroundColor:
        "#FFFFFF",

      borderRadius: 14,

      borderColor:
        "#E8DDD7",

      borderWidth: 1,

      paddingHorizontal:
        16,

      paddingVertical:
        14,

      fontSize: 16,

      color:
        "#3B241C",
    },

    // ======================================
    // LOCATION
    // ======================================

    locationButton: {
      backgroundColor:
        "#F1E4DC",

      borderRadius: 18,

      paddingVertical:
        13,

      alignItems:
        "center",

      marginTop: 3,

      borderWidth: 1,

      borderColor:
        "#E4D3C9",
    },

    locationButtonText: {
      color:
        "#6F4E37",

      fontSize: 14,

      fontWeight:
        "700",
    },

    locationConfirmed: {
      color:
        "#6F7D59",

      fontSize: 12,

      fontWeight:
        "600",

      marginTop: 2,
    },

    // ======================================
    // PHOTO
    // ======================================

    photoButton: {
      minHeight: 130,

      borderRadius: 16,

      borderWidth: 1,

      borderStyle:
        "dashed",

      borderColor:
        "#D9C7BC",

      backgroundColor:
        "#FFFDFC",

      justifyContent:
        "center",

      alignItems:
        "center",

      padding: 16,
    },

    photoIcon: {
      fontSize: 28,
    },

    photoTitle: {
      color:
        "#6F4E37",

      fontSize: 15,

      fontWeight:
        "700",

      marginTop: 6,
    },

    photoSubtitle: {
      color:
        "#A48B7F",

      fontSize: 12,

      marginTop: 3,
    },

    imageContainer: {
      backgroundColor:
        "#FFFFFF",

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        "#E8DDD7",

      overflow:
        "hidden",
    },

    previewImage: {
      width: "100%",

      height: 220,
    },

    imageActions: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      padding: 12,
    },

    changePhotoButton: {
      backgroundColor:
        "#F1E4DC",

      paddingHorizontal:
        16,

      paddingVertical: 9,

      borderRadius: 18,
    },

    changePhotoText: {
      color:
        "#6F4E37",

      fontWeight:
        "700",

      fontSize: 13,
    },

    removePhotoButton: {
      paddingHorizontal:
        14,

      paddingVertical: 9,
    },

    removePhotoText: {
      color:
        "#B85C5C",

      fontWeight:
        "700",

      fontSize: 13,
    },

    // ======================================
    // RATING
    // ======================================

    ratingContainer: {
      flexDirection:
        "row",

      gap: 8,
    },

    star: {
      fontSize: 30,
    },

    // ======================================
    // THOUGHTS
    // ======================================

    textArea: {
      height: 90,

      textAlignVertical:
        "top",
    },

    // ======================================
    // SHARE WITH
    // ======================================

    shareLabel: {
      marginTop: 18,
    },

    shareDescription: {
      fontSize: 13,

      color:
        "#8A6F63",

      marginTop: -4,

      marginBottom: 2,
    },

    shareOptions: {
      gap: 10,

      paddingVertical: 6,

      paddingRight: 10,
    },

    shareOption: {
      minHeight: 44,

      maxWidth: 190,

      paddingHorizontal:
        16,

      borderRadius: 22,

      borderWidth: 1,

      borderColor:
        "#E2D3CA",

      backgroundColor:
        "#FFFFFF",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    shareOptionSelected: {
      backgroundColor:
        "#6F4E37",

      borderColor:
        "#6F4E37",
    },

    shareOptionText: {
      color:
        "#6F4E37",

      fontSize: 14,

      fontWeight:
        "700",
    },

    shareOptionTextSelected: {
      color:
        "#FFFFFF",
    },

    shareGroupIcon: {
      width: 22,

      height: 22,

      marginRight: 7,
    },

    loadingGroupsText: {
      color:
        "#8A6F63",

      fontSize: 12,

      marginTop: 2,
    },

    noGroupsText: {
      color:
        "#9A8175",

      fontSize: 12,

      lineHeight: 18,

      marginTop: 2,
    },

    // ======================================
    // SUBMIT
    // ======================================

    button: {
      backgroundColor:
        "#6F4E37",

      paddingVertical:
        16,

      borderRadius: 30,

      alignItems:
        "center",

      marginTop: 20,
    },

    disabled: {
      opacity: 0.6,
    },

    buttonText: {
      color:
        "#FFFFFF",

      fontSize: 17,

      fontWeight:
        "600",
    },
  });