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
  useWindowDimensions,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Person = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export default function FollowersScreen() {
  const { user } = useAuth();

  const { width } =
    useWindowDimensions();

  const isSmallMobile =
    width < 380;

  const isDesktop =
    width >= 1024;

  const [people, setPeople] =
    useState<Person[]>([]);

  const [followingIds, setFollowingIds] =
    useState<Set<string>>(
      new Set()
    );

  const [loading, setLoading] =
    useState(true);

  // ==========================================
  // LOAD FOLLOWERS
  // ==========================================

  const loadFollowers =
    useCallback(async () => {
      if (!user) {
        setPeople([]);
        setFollowingIds(
          new Set()
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // ======================================
        // PEOPLE FOLLOWING ME
        // ======================================

        const {
          data: followerData,
          error: followerError,
        } = await supabase
          .from("follows")
          .select("follower_id")
          .eq(
            "following_id",
            user.id
          );

        if (followerError) {
          throw followerError;
        }

        const followerIds =
          (followerData ?? [])
            .map(
              (item) =>
                item.follower_id
            )
            .filter(Boolean);

        // ======================================
        // PEOPLE I FOLLOW
        // ======================================

        const {
          data: myFollowingData,
          error:
            myFollowingError,
        } = await supabase
          .from("follows")
          .select("following_id")
          .eq(
            "follower_id",
            user.id
          );

        if (
          myFollowingError
        ) {
          throw myFollowingError;
        }

        const myFollowingIds =
          new Set<string>(
            (
              myFollowingData ??
              []
            )
              .map(
                (item) =>
                  item.following_id
              )
              .filter(Boolean)
          );

        setFollowingIds(
          myFollowingIds
        );

        // ======================================
        // NO FOLLOWERS
        // ======================================

        if (
          followerIds.length ===
          0
        ) {
          setPeople([]);
          return;
        }

        // ======================================
        // LOAD PROFILES
        // ======================================

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, name, avatar_url, bio"
          )
          .in(
            "id",
            followerIds
          );

        if (profileError) {
          throw profileError;
        }

        setPeople(
          profileData ?? []
        );
      } catch (error: any) {
        console.error(
          "Error loading followers:",
          error
        );

        Alert.alert(
          "Error",
          error.message ??
            "Could not load followers."
        );
      } finally {
        setLoading(false);
      }
    }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadFollowers();
    }, [loadFollowers])
  );

  // ==========================================
  // FOLLOW / UNFOLLOW
  // ==========================================

  const handleFollowToggle =
    async (
      personId: string
    ) => {
      if (!user) {
        return;
      }

      const isFollowing =
        followingIds.has(
          personId
        );

      try {
        if (isFollowing) {
          const { error } =
            await supabase
              .from("follows")
              .delete()
              .eq(
                "follower_id",
                user.id
              )
              .eq(
                "following_id",
                personId
              );

          if (error) {
            throw error;
          }

          setFollowingIds(
            (current) => {
              const updated =
                new Set(
                  current
                );

              updated.delete(
                personId
              );

              return updated;
            }
          );
        } else {
          const { error } =
            await supabase
              .from("follows")
              .insert({
                follower_id:
                  user.id,

                following_id:
                  personId,
              });

          if (error) {
            throw error;
          }

          setFollowingIds(
            (current) => {
              const updated =
                new Set(
                  current
                );

              updated.add(
                personId
              );

              return updated;
            }
          );
        }
      } catch (error: any) {
        console.error(
          "Follow error:",
          error
        );

        Alert.alert(
          "Error",
          error.message ??
            "Could not update follow."
        );
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
          Loading...
        </Text>
      </View>
    );
  }

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
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.container,

            isDesktop &&
              styles.containerDesktop,

            isSmallMobile &&
              styles.containerSmall,
          ]}
        >
          {/* BACK */}

          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.replace(
                "/(tabs)/profile"
              )
            }
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color="#6F4E37"
            />

            <Text
              style={
                styles.backText
              }
            >
              Back
            </Text>
          </Pressable>

          {/* HEADER */}

          <Text
            style={[
              styles.title,

              isSmallMobile &&
                styles.titleSmall,
            ]}
          >
            Followers
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Coffee friends following you.
          </Text>

          <Text
            style={
              styles.countText
            }
          >
            {people.length}{" "}
            {people.length === 1
              ? "person"
              : "people"}
          </Text>

          {/* EMPTY */}

          {people.length === 0 ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <Ionicons
                name="people-outline"
                size={38}
                color="#A48B7F"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No followers yet
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                When someone follows you, they will appear here.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.peopleList
              }
            >
              {people.map(
                (person) => {
                  const isFollowing =
                    followingIds.has(
                      person.id
                    );

                  return (
                    <View
                      key={
                        person.id
                      }
                      style={
                        styles.personCard
                      }
                    >
                      <View
                        style={
                          styles.personLeft
                        }
                      >
                        {person.avatar_url ? (
                          <Image
                            source={{
                              uri:
                                person.avatar_url,
                            }}
                            style={
                              styles.avatar
                            }
                          />
                        ) : (
                          <View
                            style={
                              styles.avatarFallback
                            }
                          >
                            <Text
                              style={
                                styles.avatarText
                              }
                            >
                              {person.name
                                ?.charAt(
                                  0
                                )
                                .toUpperCase() ??
                                "C"}
                            </Text>
                          </View>
                        )}

                        <View
                          style={
                            styles.personInfo
                          }
                        >
                          <Text
                            style={
                              styles.personName
                            }
                          >
                            {person.name ??
                              "Coffee Friend"}
                          </Text>

                          <Text
                            style={
                              styles.personBio
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {person.bio ??
                              "Coffee explorer"}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={({
                          pressed,
                        }) => [
                          isFollowing
                            ? styles.followingButton
                            : styles.followButton,

                          pressed && {
                            opacity: 0.7,
                          },
                        ]}
                        onPress={() =>
                          handleFollowToggle(
                            person.id
                          )
                        }
                      >
                        <Text
                          style={
                            isFollowing
                              ? styles.followingButtonText
                              : styles.followButtonText
                          }
                        >
                          {isFollowing
                            ? "Following"
                            : "Follow"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                }
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

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
      alignItems: "center",
      paddingBottom: 120,
    },

    container: {
      width: "100%",
      paddingHorizontal: 24,
      paddingTop: 60,
    },

    containerDesktop: {
      maxWidth: 800,
      paddingTop: 50,
    },

    containerSmall: {
      paddingHorizontal: 18,
      paddingTop: 45,
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "#FFF9F5",
    },

    loadingText: {
      marginTop: 12,
      color: "#76594F",
      fontSize: 14,
    },

    backButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginBottom: 24,
    },

    backText: {
      color: "#6F4E37",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 2,
    },

    title: {
      fontSize: 34,
      fontWeight: "700",
      color: "#3B241C",
    },

    titleSmall: {
      fontSize: 30,
    },

    subtitle: {
      fontSize: 15,
      color: "#76594F",
      marginTop: 7,
      lineHeight: 21,
    },

    countText: {
      fontSize: 13,
      color: "#A48B7F",
      marginTop: 28,
      marginBottom: 10,
    },

    peopleList: {
      width: "100%",
      gap: 12,
    },

    personCard: {
      width: "100%",
      minHeight: 82,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E8DDD7",
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    personLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      marginRight: 12,
    },

    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },

    avatarFallback: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor:
        "#6F4E37",
      justifyContent:
        "center",
      alignItems: "center",
    },

    avatarText: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "700",
    },

    personInfo: {
      flex: 1,
      marginLeft: 14,
    },

    personName: {
      fontSize: 16,
      fontWeight: "700",
      color: "#3B241C",
    },

    personBio: {
      fontSize: 13,
      color: "#A48B7F",
      marginTop: 4,
    },

    followButton: {
      backgroundColor:
        "#6F4E37",
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 22,
    },

    followButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },

    followingButton: {
      borderWidth: 1,
      borderColor:
        "#DCCBC2",
      backgroundColor:
        "#F7EFEA",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 22,
    },

    followingButtonText: {
      color: "#6F4E37",
      fontSize: 13,
      fontWeight: "700",
    },

    emptyCard: {
      width: "100%",
      marginTop: 10,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E8DDD7",
      borderRadius: 20,
      padding: 30,
      alignItems: "center",
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#3B241C",
      marginTop: 14,
      textAlign: "center",
    },

    emptyText: {
      fontSize: 14,
      color: "#76594F",
      textAlign: "center",
      lineHeight: 20,
      marginTop: 7,
      maxWidth: 350,
    },
  });