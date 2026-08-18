import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// ==========================================
// TYPES
// ==========================================

type Profile = {
  id: string;
  name: string | null;
};

type FollowRow = {
  following_id: string;
};

// ==========================================
// SCREEN
// ==========================================

export default function DiscoverPeopleScreen() {
  const { user } = useAuth();

  const { width } =
    useWindowDimensions();

  const isSmallMobile =
    width < 380;

  const isTablet =
    width >= 768;

  const isDesktop =
    width >= 1024;

  const [profiles, setProfiles] =
    useState<Profile[]>([]);

  const [followingIds, setFollowingIds] =
    useState<string[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    changingFollowId,
    setChangingFollowId,
  ] = useState<string | null>(null);

  // ==========================================
  // LOAD PEOPLE + FOLLOWING
  // ==========================================

  const loadPeople =
    useCallback(async () => {
      if (!user) {
        setProfiles([]);
        setFollowingIds([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // ======================================
        // LOAD PROFILES
        // ======================================

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, name"
          )
          .neq(
            "id",
            user.id
          )
          .order(
            "name",
            {
              ascending: true,
            }
          );

        if (profileError) {
          throw profileError;
        }

        // ======================================
        // LOAD CURRENT USER FOLLOWING
        // ======================================

        const {
          data: followData,
          error: followError,
        } = await supabase
          .from("follows")
          .select(
            "following_id"
          )
          .eq(
            "follower_id",
            user.id
          );

        if (followError) {
          throw followError;
        }

        setProfiles(
          (profileData ?? []) as Profile[]
        );

        setFollowingIds(
          (
            (followData ?? []) as FollowRow[]
          ).map(
            (follow) =>
              follow.following_id
          )
        );
      } catch (error: any) {
        console.error(
          "Error loading people:",
          error
        );

        Alert.alert(
          "Discover People",
          error?.message ??
            "Could not load people."
        );
      } finally {
        setLoading(false);
      }
    }, [user]);

  // ==========================================
  // REFRESH WHEN SCREEN OPENS
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      loadPeople();
    }, [loadPeople])
  );

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredProfiles =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return profiles;
      }

      return profiles.filter(
        (profile) => {
          const name =
            profile.name
              ?.toLowerCase() ??
            "";

          return name.includes(
            query
          );
        }
      );
    }, [profiles, search]);

  // ==========================================
  // FOLLOW / UNFOLLOW
  // ==========================================

  const handleFollow =
    async (
      profileId: string
    ) => {
      if (!user) {
        return;
      }

      if (changingFollowId) {
        return;
      }

      const isFollowing =
        followingIds.includes(
          profileId
        );

      try {
        setChangingFollowId(
          profileId
        );

        // ======================================
        // UNFOLLOW
        // ======================================

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
                profileId
              );

          if (error) {
            throw error;
          }

          setFollowingIds(
            (current) =>
              current.filter(
                (id) =>
                  id !==
                  profileId
              )
          );

          return;
        }

        // ======================================
        // FOLLOW
        // ======================================

        const { error } =
          await supabase
            .from("follows")
            .insert({
              follower_id:
                user.id,

              following_id:
                profileId,
            });

        if (error) {
          throw error;
        }

        setFollowingIds(
          (current) => [
            ...current,
            profileId,
          ]
        );
      } catch (error: any) {
        console.error(
          "Error changing follow:",
          error
        );

        Alert.alert(
          "Follow",
          error?.message ??
            "Could not update follow."
        );
      } finally {
        setChangingFollowId(
          null
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
        <Image
          source={require(
            "@/assets/images/PeopleLogo.png"
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
          Finding coffee people...
        </Text>
      </View>
    );
  }

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
          <Text
            style={
              styles.backText
            }
          >
            ‹ Back
          </Text>
        </Pressable>

        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={[
                styles.title,

                isSmallMobile &&
                  styles.titleSmall,
              ]}
            >
              Discover People
            </Text>

            <Text
              style={[
                styles.subtitle,

                isSmallMobile &&
                  styles.subtitleSmall,
              ]}
            >
              Find coffee lovers and follow their latest discoveries.
            </Text>
          </View>

          <View
            style={
              styles.headerIcon
            }
          >
            <Image
              source={require(
                "@/assets/images/PeopleLogo.png"
              )}
              style={
                styles.headerLogo
              }
              resizeMode="contain"
            />
          </View>
        </View>

        {/* SEARCH */}

        <View
          style={
            styles.searchContainer
          }
        >
          <Image
            source={require(
              "@/assets/images/SearchLogo.png"
            )}
            style={
              styles.searchIcon
            }
            resizeMode="contain"
          />

          <TextInput
            style={[
              styles.searchInput,

              {
                outlineStyle:
                  "none",
              } as any,
            ]}
            placeholder="Search coffee people..."
            placeholderTextColor="#A58D82"
            value={search}
            onChangeText={
              setSearch
            }
            autoCapitalize="none"
            autoCorrect={false}
          />

          {search.length >
          0 ? (
            <Pressable
              style={
                styles.clearButton
              }
              onPress={() =>
                setSearch("")
              }
            >
              <Text
                style={
                  styles.clearText
                }
              >
                ×
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* RESULT COUNT */}

        <Text
          style={
            styles.resultText
          }
        >
          {filteredProfiles.length ===
          1
            ? "1 coffee person"
            : `${filteredProfiles.length} coffee people`}
        </Text>

        {/* PEOPLE */}

        {filteredProfiles.length ===
        0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <View
              style={
                styles.emptyCircle
              }
            >
              <Image
                source={require(
                  "@/assets/images/PeopleLogo.png"
                )}
                style={
                  styles.peopleIcon
                }
                resizeMode="contain"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              {search
                ? "No people found"
                : "No coffee people yet"}
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {search
                ? "Try searching for another name."
                : "Other CupTogether users will appear here."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={
              filteredProfiles
            }
            keyExtractor={(
              item
            ) => item.id}
            showsVerticalScrollIndicator={
              isDesktop
            }
            contentContainerStyle={
              styles.listContent
            }
            renderItem={({
              item,
            }) => {
              const isFollowing =
                followingIds.includes(
                  item.id
                );

              const isChanging =
                changingFollowId ===
                item.id;

              const initial =
                item.name
                  ?.charAt(0)
                  .toUpperCase() ??
                "C";

              return (
                <View
                  style={
                    styles.personCard
                  }
                >
                  {/* AVATAR */}

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
                      {initial}
                    </Text>
                  </View>

                  {/* PERSON */}

                  <View
                    style={
                      styles.personInfo
                    }
                  >
                    <Text
                      style={
                        styles.personName
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {item.name ??
                        "Coffee Friend"}
                    </Text>

                    <Text
                      style={
                        styles.personSubtitle
                      }
                    >
                      Coffee explorer
                    </Text>
                  </View>

                  {/* FOLLOW */}

                  <Pressable
                    style={[
                      styles.followButton,

                      isFollowing &&
                        styles.followingButton,

                      isChanging &&
                        styles.disabledButton,
                    ]}
                    disabled={
                      isChanging
                    }
                    onPress={() =>
                      handleFollow(
                        item.id
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.followButtonText,

                        isFollowing &&
                          styles.followingButtonText,
                      ]}
                    >
                      {isChanging
                        ? "..."
                        : isFollowing
                        ? "Following"
                        : "Follow"}
                    </Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}
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
    // LOADING
    // ======================================

    loadingContainer: {
      flex: 1,
      backgroundColor:
        "#FFF9F5",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    loadingLogo: {
      width: 80,
      height: 80,
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
      alignItems:
        "center",
    },

    container: {
      flex: 1,
      width: "100%",
      paddingHorizontal:
        22,
      paddingTop: 54,
    },

    containerSmall: {
      paddingHorizontal:
        18,
      paddingTop: 48,
    },

    containerTablet: {
      maxWidth: 760,
    },

    containerDesktop: {
      maxWidth: 820,
      paddingHorizontal:
        28,
      paddingTop: 50,
    },

    // ======================================
    // BACK
    // ======================================

    backButton: {
      alignSelf:
        "flex-start",
      marginBottom: 18,
    },

    backText: {
      fontSize: 16,
      fontWeight:
        "600",
      color:
        "#6F4E37",
    },

    // ======================================
    // HEADER
    // ======================================

    header: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    headerText: {
      flex: 1,
      paddingRight: 16,
    },

    title: {
      fontSize: 30,
      fontWeight:
        "800",
      color:
        "#3B241C",
    },

    titleSmall: {
      fontSize: 27,
    },

    subtitle: {
      fontSize: 14,
      color:
        "#8A6F63",
      lineHeight: 20,
      marginTop: 6,
    },

    subtitleSmall: {
      fontSize: 13,
      lineHeight: 18,
    },

    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        "#F1E4DC",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    headerLogo: {
      width: 32,
      height: 32,
    },

    // ======================================
    // SEARCH
    // ======================================

    searchContainer: {
      minHeight: 54,
      borderRadius: 18,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#EADDD5",

      flexDirection:
        "row",
      alignItems:
        "center",

      paddingHorizontal:
        16,
      marginTop: 24,

      shadowColor:
        "#3B241C",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 6,

      elevation: 1,
    },

    searchIcon: {
      width: 22,
      height: 22,
      resizeMode:
        "contain",
      marginRight: 10,
    },

    searchInput: {
      flex: 1,
      height: 52,
      fontSize: 15,
      color:
        "#3B241C",

      borderWidth: 0,
      backgroundColor:
        "transparent",
    },

    clearButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor:
        "#F5EAE4",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginLeft: 8,
    },

    clearText: {
      fontSize: 21,
      lineHeight: 23,
      color:
        "#76594F",
      fontWeight:
        "500",
    },

    // ======================================
    // RESULTS
    // ======================================

    resultText: {
      fontSize: 12,
      color:
        "#9A8175",
      marginTop: 13,
      marginBottom: 12,
    },

    listContent: {
      paddingBottom: 50,
    },

    // ======================================
    // PERSON CARD
    // ======================================

    personCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#EFE3DC",
      padding: 14,
      marginBottom: 11,

      flexDirection:
        "row",
      alignItems:
        "center",
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,

      backgroundColor:
        "#6F4E37",

      justifyContent:
        "center",
      alignItems:
        "center",
    },

    avatarText: {
      color:
        "#FFFFFF",
      fontSize: 19,
      fontWeight:
        "700",
    },

    personInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 10,
    },

    personName: {
      fontSize: 16,
      fontWeight:
        "700",
      color:
        "#3B241C",
    },

    personSubtitle: {
      fontSize: 12,
      color:
        "#9A8175",
      marginTop: 3,
    },

    // ======================================
    // FOLLOW
    // ======================================

    followButton: {
      minWidth: 90,

      paddingHorizontal:
        15,
      paddingVertical:
        10,

      borderRadius: 20,

      backgroundColor:
        "#6F4E37",

      alignItems:
        "center",
    },

    followingButton: {
      backgroundColor:
        "#F3E9E3",
      borderWidth: 1,
      borderColor:
        "#DCCBC1",
    },

    disabledButton: {
      opacity: 0.6,
    },

    followButtonText: {
      color:
        "#FFFFFF",
      fontSize: 13,
      fontWeight:
        "700",
    },

    followingButtonText: {
      color:
        "#6F4E37",
    },

    // ======================================
    // EMPTY
    // ======================================

    emptyContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingBottom:
        100,
    },

    emptyCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,

      backgroundColor:
        "#F1E4DC",

      justifyContent:
        "center",
      alignItems:
        "center",
    },

    emptyTitle: {
      fontSize: 21,
      fontWeight:
        "700",
      color:
        "#3B241C",
      marginTop: 17,
    },

    peopleIcon: {
      width: 48,
      height: 48,
    },

    emptyText: {
      fontSize: 14,
      color:
        "#8A6F63",
      textAlign:
        "center",
      lineHeight: 21,
      marginTop: 7,
      maxWidth: 280,
    },
  });