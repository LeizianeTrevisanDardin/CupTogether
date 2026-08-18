import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
};

export default function ProfileScreen() {
  const { user } = useAuth();

  const [
    profile,
    setProfile,
  ] =
    useState<Profile | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    followingCount,
    setFollowingCount,
  ] = useState(0);

  const [
    followersCount,
    setFollowersCount,
  ] = useState(0);

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  const loadProfile =
    useCallback(async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // PROFILE

        const {
          data,
          error,
        } = await supabase
          .from("profiles")
          .select(
            "id, name, avatar_url, bio"
          )
          .eq(
            "id",
            user.id
          )
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);

        // FOLLOWING COUNT

        const {
          count:
            followingTotal,
          error:
            followingError,
        } = await supabase
          .from("follows")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "follower_id",
            user.id
          );

        if (followingError) {
          console.log(
            "Error counting following:",
            followingError
          );
        } else {
          setFollowingCount(
            followingTotal ?? 0
          );
        }

        // FOLLOWERS COUNT

        const {
          count:
            followersTotal,
          error:
            followersError,
        } = await supabase
          .from("follows")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "following_id",
            user.id
          );

        if (followersError) {
          console.log(
            "Error counting followers:",
            followersError
          );
        } else {
          setFollowersCount(
            followersTotal ?? 0
          );
        }
      } catch (
        error: any
      ) {
        console.error(
          "Error loading profile:",
          error
        );

        Alert.alert(
          "Profile error",
          error?.message ??
            "Could not load your profile."
        );
      } finally {
        setLoading(false);
      }
    }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout =
    async () => {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        Alert.alert(
          "Logout failed",
          error.message
        );

        return;
      }

      router.replace(
        "/welcome"
      );
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
        <Image
          source={require(
            "@/assets/images/CupIconApp.png"
          )}
          style={
            styles.loadingLogo
          }
          resizeMode="contain"
        />

        <ActivityIndicator
          size="small"
          color="#6F4E37"
          style={
            styles.loadingIndicator
          }
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

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <View
      style={
        styles.screen
      }
    >
      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.container
          }
        >
          {/* AVATAR */}

          {profile?.avatar_url ? (
            <Image
              source={{
                uri:
                  profile.avatar_url,
              }}
              style={
                styles.avatarImage
              }
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.avatar
              }
            >
              <Text
                style={
                  styles.avatarText
                }
              >
                {profile?.name
                  ?.charAt(0)
                  .toUpperCase() ??
                  "C"}
              </Text>
            </View>
          )}

          {/* PROFILE INFO */}

          <Text
            style={
              styles.name
            }
          >
            {profile?.name ??
              "Coffee Friend"}
          </Text>

          <Text
            style={
              styles.email
            }
          >
            {user?.email}
          </Text>

          <Text
            style={
              styles.bio
            }
          >
            {profile?.bio ??
              "Coffee lover"}
          </Text>

          {/* SOCIAL STATS */}

          <View
            style={
              styles.statsContainer
            }
          >
            <Pressable
              style={
                styles.statButton
              }
              onPress={() =>
                router.push(
                  "/following"
                )
              }
            >
              <Text
                style={
                  styles.statNumber
                }
              >
                {followingCount}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Following
              </Text>
            </Pressable>

            <View
              style={
                styles.statDivider
              }
            />

            <Pressable
              style={
                styles.statButton
              }
              onPress={() =>
                router.push(
                  "/followers"
                )
              }
            >
              <Text
                style={
                  styles.statNumber
                }
              >
                {followersCount}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Followers
              </Text>
            </Pressable>
          </View>

          {/* EDIT PROFILE */}

          <Pressable
            style={
              styles.editButton
            }
            onPress={() =>
              router.push(
                "/edit-profile"
              )
            }
          >
            <Text
              style={
                styles.editButtonText
              }
            >
              Edit Profile
            </Text>
          </Pressable>

          {/* DISCOVER PEOPLE */}

          <Pressable
            style={
              styles.menuButton
            }
            onPress={() =>
              router.push(
                "/discover-people"
              )
            }
          >
            <View
              style={
                styles.menuLeft
              }
            >
              <Image
                source={require(
                  "@/assets/images/PeopleLogo.png"
                )}
                style={
                  styles.menuIconImage
                }
                resizeMode="contain"
              />

              <Text
                style={
                  styles.menuButtonText
                }
              >
                Discover People
              </Text>
            </View>

            <Text
              style={
                styles.menuArrow
              }
            >
              ›
            </Text>
          </Pressable>

          {/* SAVED COFFEES */}

          <Pressable
            style={
              styles.menuButton
            }
            onPress={() =>
              router.push(
                "/saved-coffees"
              )
            }
          >
            <View
              style={
                styles.menuLeft
              }
            >
              <Ionicons
                name="bookmark-outline"
                size={21}
                color="#6F4E37"
              />

              <Text
                style={
                  styles.menuButtonText
                }
              >
                Saved Coffees
              </Text>
            </View>

            <Text
              style={
                styles.menuArrow
              }
            >
              ›
            </Text>
          </Pressable>

          {/* SIGN OUT */}

          <Pressable
            style={
              styles.logoutButton
            }
            onPress={
              handleLogout
            }
          >
            <Text
              style={
                styles.logoutText
              }
            >
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

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

    loadingLogo: {
      width: 78,
      height: 78,
    },

    loadingIndicator: {
      marginTop: 14,
    },

    loadingText: {
      color:
        "#76594F",
      fontSize: 14,
      marginTop: 10,
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
      width: "100%",
    },

    scrollContent: {
      flexGrow: 1,
      alignItems:
        "center",
      paddingBottom: 120,
    },

    container: {
      width: "100%",
      maxWidth: 460,
      alignItems:
        "center",
      paddingHorizontal: 24,
      paddingTop: 70,
      paddingBottom: 50,
    },

    // ======================================
    // AVATAR
    // ======================================

    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor:
        "#6F4E37",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor:
        "#F1E4DC",
    },

    avatarText: {
      color:
        "#FFFFFF",
      fontSize: 40,
      fontWeight:
        "700",
    },

    // ======================================
    // PROFILE INFO
    // ======================================

    name: {
      fontSize: 28,
      fontWeight:
        "700",
      color:
        "#3B241C",
      marginTop: 20,
    },

    email: {
      fontSize: 14,
      color:
        "#A48B7F",
      marginTop: 6,
    },

    bio: {
      fontSize: 16,
      color:
        "#76594F",
      marginTop: 18,
      textAlign:
        "center",
    },

    // ======================================
    // SOCIAL STATS
    // ======================================

    statsContainer: {
      width: "100%",
      maxWidth: 330,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginTop: 24,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#F0E6E0",
      borderRadius: 18,
      paddingVertical: 14,
    },

    statButton: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    statNumber: {
      fontSize: 20,
      fontWeight:
        "800",
      color:
        "#3B241C",
    },

    statLabel: {
      fontSize: 12,
      color:
        "#8A6F63",
      marginTop: 3,
      fontWeight:
        "600",
    },

    statDivider: {
      width: 1,
      height: 34,
      backgroundColor:
        "#E8DDD7",
    },

    // ======================================
    // EDIT PROFILE
    // ======================================

    editButton: {
      marginTop: 20,
      backgroundColor:
        "#6F4E37",
      borderRadius: 30,
      paddingVertical: 14,
      paddingHorizontal: 40,
    },

    editButtonText: {
      color:
        "#FFFFFF",
      fontSize: 16,
      fontWeight:
        "600",
    },

    // ======================================
    // MENU
    // ======================================

    menuButton: {
      width: "100%",
      maxWidth: 360,
      marginTop: 14,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#F0E6E0",
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 16,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    menuLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
    },

    menuIconImage: {
      width: 23,
      height: 23,
    },

    menuButtonText: {
      color:
        "#3B241C",
      fontSize: 16,
      fontWeight:
        "600",
    },

    menuArrow: {
      color:
        "#A48B7F",
      fontSize: 26,
    },

    // ======================================
    // LOGOUT
    // ======================================

    logoutButton: {
      marginTop: 18,
      borderWidth: 1,
      borderColor:
        "#6F4E37",
      borderRadius: 30,
      paddingVertical: 14,
      paddingHorizontal: 40,
    },

    logoutText: {
      color:
        "#6F4E37",
      fontSize: 16,
      fontWeight:
        "600",
    },
  });