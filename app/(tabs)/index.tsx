import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { CoffeeCard } from "@/components/CoffeeCard";
import { useCoffee } from "@/context/CoffeeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

import { layout } from "@/constants/layout";

// ==========================================
// TYPES
// ==========================================

type FeedFilter =
  | "for-you"
  | "friends"
  | "recent"
  | "top-rated";

// ==========================================
// GREETING
// ==========================================

const getGreeting = () => {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return {
      text: "Good morning",
      emoji: "☀️",
    };
  }

  if (hour < 18) {
    return {
      text: "Good afternoon",
      emoji: "🌤️",
    };
  }

  return {
    text: "Good evening",
    emoji: "🌙",
  };
};

// ==========================================
// SCREEN
// ==========================================

export default function FeedScreen() {
  const {
    coffees,
    loading,
    loadCoffees,
  } = useCoffee();

  const { user } =
    useAuth();

  const { width } =
    useWindowDimensions();

  // ==========================================
  // RESPONSIVE
  // ==========================================

  const isSmallMobile =
    width < 380;

  const isTablet =
    width >= 768;

  const isDesktop =
    width >= 1024;

  // ==========================================
  // STATE
  // ==========================================

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<FeedFilter>(
      "for-you"
    );

  const [
    followingIds,
    setFollowingIds,
  ] =
    useState<string[]>([]);

  const [
    loadingFollowing,
    setLoadingFollowing,
  ] =
    useState(false);

  const [
    currentUserAvatar,
    setCurrentUserAvatar,
  ] =
    useState<
      string | null
    >(null);

  const [
    currentUserName,
    setCurrentUserName,
  ] =
    useState<
      string | null
    >(null);

  const greeting =
    getGreeting();

  // ==========================================
  // RESPONSIVE VALUES
  // ==========================================

  const horizontalPadding =
    isTablet
      ? layout.tabletPadding
      : isSmallMobile
      ? 16
      : layout.mobilePadding;

  const topPadding =
    isDesktop
      ? 48
      : isTablet
      ? 50
      : 48;

  // ==========================================
  // REFRESH PROFILE + COFFEES ON FOCUS
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      const refreshFeed =
        async () => {
          if (!user) {
            setCurrentUserAvatar(
              null
            );

            setCurrentUserName(
              null
            );

            return;
          }

          // CURRENT USER PROFILE

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                "name, avatar_url"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (error) {
            console.log(
              "Error loading current user profile:",
              error
            );
          } else {
            setCurrentUserAvatar(
              data?.avatar_url ??
                null
            );

            setCurrentUserName(
              data?.name ??
                null
            );
          }

          // REFRESH POSTS

          await loadCoffees();
        };

      refreshFeed();
    }, [
      user,
      loadCoffees,
    ])
  );

  // ==========================================
  // LOAD FOLLOWING
  // ==========================================

  useEffect(() => {
    const loadFollowing =
      async () => {
        if (!user) {
          setFollowingIds(
            []
          );

          setLoadingFollowing(
            false
          );

          return;
        }

        try {
          setLoadingFollowing(
            true
          );

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "follows"
              )
              .select(
                "following_id"
              )
              .eq(
                "follower_id",
                user.id
              );

          if (error) {
            throw error;
          }

          const ids =
            (
              data ?? []
            ).map(
              (item) =>
                item.following_id
            );

          setFollowingIds(
            ids
          );
        } catch (error) {
          console.error(
            "Error loading follows:",
            error
          );

          setFollowingIds(
            []
          );
        } finally {
          setLoadingFollowing(
            false
          );
        }
      };

    loadFollowing();
  }, [user]);

  // ==========================================
  // FILTER + SORT
  // ==========================================

  const filteredCoffees =
    useMemo(() => {
      const coffeeList = [
        ...coffees,
      ];

      if (
        selectedFilter ===
        "for-you"
      ) {
        return coffeeList;
      }

      if (
        selectedFilter ===
        "friends"
      ) {
        return coffeeList.filter(
          (coffee) =>
            followingIds.includes(
              coffee.userId
            )
        );
      }

      if (
        selectedFilter ===
        "recent"
      ) {
        return coffeeList.sort(
          (a, b) => {
            const dateA =
              new Date(
                a.createdAt ??
                  0
              ).getTime();

            const dateB =
              new Date(
                b.createdAt ??
                  0
              ).getTime();

            return (
              dateB -
              dateA
            );
          }
        );
      }

      if (
        selectedFilter ===
        "top-rated"
      ) {
        return coffeeList.sort(
          (a, b) =>
            (b.rating ?? 0) -
            (a.rating ?? 0)
        );
      }

      return coffeeList;
    }, [
      coffees,
      selectedFilter,
      followingIds,
    ]);

  // ==========================================
  // EMPTY STATE MESSAGE
  // ==========================================

  const getEmptyMessage =
    () => {
      if (
        selectedFilter ===
        "friends"
      ) {
        if (
          loadingFollowing
        ) {
          return {
            title:
              "Loading friends...",

            text:
              "Finding coffee discoveries from people you follow.",
          };
        }

        if (
          followingIds.length ===
          0
        ) {
          return {
            title:
              "You're not following anyone yet",

            text:
              "Discover coffee people and follow them to see their finds here.",
          };
        }

        return {
          title:
            "No friend finds yet",

          text:
            "The people you follow haven't shared any coffee finds yet.",
        };
      }

      if (
        selectedFilter ===
        "top-rated"
      ) {
        return {
          title:
            "No rated coffees yet",

          text:
            "Highly rated coffee finds will appear here.",
        };
      }

      return {
        title:
          "No coffee finds yet",

        text:
          "Add your first coffee find and start building your coffee feed.",
      };
    };

  const emptyMessage =
    getEmptyMessage();

  // ==========================================
  // FILTER BUTTON
  // ==========================================

  const renderFilter = (
    filter: FeedFilter,
    label: string
  ) => {
    const active =
      selectedFilter ===
      filter;

    return (
      <Pressable
        style={[
          styles.filterButton,

          isSmallMobile &&
            styles.filterButtonSmall,

          active &&
            styles.filterButtonActive,
        ]}
        onPress={() =>
          setSelectedFilter(
            filter
          )
        }
      >
        <Text
          style={[
            styles.filterText,

            isSmallMobile &&
              styles.filterTextSmall,

            active &&
              styles.filterTextActive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  // ==========================================
  // AVATAR FALLBACK
  // ==========================================

  const currentUserInitial =
    currentUserName
      ?.charAt(0)
      .toUpperCase() ??
    user?.email
      ?.charAt(0)
      .toUpperCase() ??
    "C";

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

        <Text
          style={
            styles.loadingText
          }
        >
          Loading coffee finds...
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
      <View
        style={[
          styles.page,

          {
            paddingHorizontal:
              horizontalPadding,

            paddingTop:
              topPadding,
          },
        ]}
      >
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
                styles.greeting,

                isSmallMobile &&
                  styles.greetingSmall,
              ]}
            >
              {greeting.text}{" "}
              {greeting.emoji}
            </Text>

            <Text
              style={[
                styles.title,

                isSmallMobile &&
                  styles.titleSmall,

                isDesktop &&
                  styles.titleDesktop,
              ]}
            >
              Coffee Finds
            </Text>

            <Text
              style={[
                styles.subtitle,

                isSmallMobile &&
                  styles.subtitleSmall,
              ]}
            >
              Discover what your
              coffee friends are
              drinking.
            </Text>
          </View>

          {/* CURRENT USER PROFILE */}

          <View
            style={
              styles.profileArea
            }
          >
            <Pressable
              style={[
                styles.profileButton,

                isSmallMobile &&
                  styles.profileButtonSmall,
              ]}
              onPress={() =>
                router.push(
                  "/(tabs)/profile"
                )
              }
            >
              {currentUserAvatar ? (
                <Image
                  source={{
                    uri:
                      currentUserAvatar,
                  }}
                  style={[
                    styles.headerAvatar,

                    isSmallMobile &&
                      styles.headerAvatarSmall,
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.avatarFallback,

                    isSmallMobile &&
                      styles.avatarFallbackSmall,
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarFallbackText,

                      isSmallMobile &&
                        styles.avatarFallbackTextSmall,
                    ]}
                  >
                    {currentUserInitial}
                  </Text>
                </View>
              )}
            </Pressable>

            <Text
              style={[
                styles.profileName,

                isSmallMobile &&
                  styles.profileNameSmall,
              ]}
              numberOfLines={
                1
              }
            >
              {currentUserName ??
                "Coffee Friend"}
            </Text>
          </View>
        </View>

        {/* FILTERS */}

        <View
          style={
            styles.filtersContainer
          }
        >
          {renderFilter(
            "for-you",
            "For You"
          )}

          {renderFilter(
            "friends",
            "Friends"
          )}

          {renderFilter(
            "recent",
            "Recent"
          )}

          {renderFilter(
            "top-rated",
            "Top Rated"
          )}
        </View>

        {/* FEED */}

        <View
          style={
            styles.feedArea
          }
        >
          {filteredCoffees.length ===
          0 ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <View
                style={[
                  styles.emptyCircle,

                  isSmallMobile &&
                    styles.emptyCircleSmall,
                ]}
              >
                <Image
                  source={require(
                    "@/assets/images/CupIconApp.png"
                  )}
                  style={[
                    styles.emptyLogo,

                    isSmallMobile &&
                      styles.emptyLogoSmall,
                  ]}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={[
                  styles.emptyTitle,

                  isSmallMobile &&
                    styles.emptyTitleSmall,
                ]}
              >
                {emptyMessage.title}
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                {emptyMessage.text}
              </Text>

              {selectedFilter ===
              "friends" ? (
                <Pressable
                  style={
                    styles.emptyButton
                  }
                  onPress={() =>
                    router.push(
                      "/discover-people"
                    )
                  }
                >
                  <Text
                    style={
                      styles.emptyButtonText
                    }
                  >
                    Discover People
                  </Text>
                </Pressable>
              ) : null}

              {selectedFilter ===
              "for-you" ? (
                <Pressable
                  style={
                    styles.emptyButton
                  }
                  onPress={() =>
                    router.push(
                      "/(tabs)/add-coffee"
                    )
                  }
                >
                  <Text
                    style={
                      styles.emptyButtonText
                    }
                  >
                    + Add Coffee
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <FlatList
              style={
                styles.feedList
              }
              data={
                filteredCoffees
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
              }) => (
                <View
                  style={[
                    styles.cardWrapper,

                    isDesktop &&
                      styles.cardWrapperDesktop,
                  ]}
                >
                  <CoffeeCard
                    coffee={
                      item
                    }
                  />
                </View>
              )}
            />
          )}

          {/* FLOATING ADD BUTTON */}

          {coffees.length >
          0 ? (
            <Pressable
              style={[
                styles.floatingButton,

                isSmallMobile &&
                  styles.floatingButtonSmall,

                isDesktop &&
                  styles.floatingButtonDesktop,
              ]}
              onPress={() =>
                router.push(
                  "/(tabs)/add-coffee"
                )
              }
            >
              <Text
                style={[
                  styles.floatingButtonText,

                  isSmallMobile &&
                    styles.floatingButtonTextSmall,
                ]}
              >
                +
              </Text>
            </Pressable>
          ) : null}
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
      width: 70,
      height: 70,
      marginBottom: 12,
    },

    loadingText: {
      fontSize: 15,
      color:
        "#76594F",
      fontWeight:
        "600",
    },

    screen: {
      flex: 1,
      backgroundColor:
        "#FFF9F5",
      alignItems:
        "center",
    },

    page: {
      flex: 1,
      width: "100%",
      maxWidth:
        layout.desktopMaxWidth,
      backgroundColor:
        "#FFF9F5",
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
        "center",
      marginBottom: 22,
    },

    headerText: {
      flex: 1,
      paddingRight: 16,
    },

    greeting: {
      fontSize: 14,
      color:
        "#8A6F63",
      marginBottom: 5,
    },

    greetingSmall: {
      fontSize: 12,
    },

    title: {
      fontSize: 31,
      fontWeight:
        "800",
      color:
        "#3B241C",
      letterSpacing:
        -0.6,
    },

    titleSmall: {
      fontSize: 27,
    },

    titleDesktop: {
      fontSize: 34,
    },

    subtitle: {
      fontSize: 14,
      color:
        "#8A6F63",
      marginTop: 5,
      lineHeight: 20,
    },

    subtitleSmall: {
      fontSize: 13,
      lineHeight: 18,
    },

    // ======================================
    // PROFILE
    // ======================================

    profileArea: {
      alignItems:
        "center",
      justifyContent:
        "center",
      maxWidth: 100,
    },

    profileButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        "#F1E4DC",
      justifyContent:
        "center",
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#EADCD3",
      overflow:
        "hidden",
    },

    profileButtonSmall: {
      width: 42,
      height: 42,
      borderRadius: 21,
    },

    headerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },

    headerAvatarSmall: {
      width: 42,
      height: 42,
      borderRadius: 21,
    },

    avatarFallback: {
      width: "100%",
      height: "100%",
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#6F4E37",
    },

    avatarFallbackSmall: {
      width: "100%",
      height: "100%",
    },

    avatarFallbackText: {
      color:
        "#FFFFFF",
      fontSize: 18,
      fontWeight:
        "700",
    },

    avatarFallbackTextSmall: {
      fontSize: 16,
    },

    profileName: {
      marginTop: 6,
      fontSize: 12,
      fontWeight:
        "600",
      color:
        "#6F4E37",
      textAlign:
        "center",
      maxWidth: 100,
    },

    profileNameSmall: {
      fontSize: 11,
      maxWidth: 80,
    },

    // ======================================
    // FILTERS
    // ======================================

    filtersContainer: {
      flexDirection:
        "row",
      width: "100%",
      gap: 8,
      marginBottom: 20,
    },

    filterButton: {
      flex: 1,
      minHeight: 38,
      paddingHorizontal: 8,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor:
        "#F3E9E3",
      borderWidth: 1,
      borderColor:
        "transparent",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    filterButtonSmall: {
      minHeight: 35,
      paddingHorizontal: 4,
      paddingVertical: 7,
    },

    filterButtonActive: {
      backgroundColor:
        "#6F4E37",
    },

    filterText: {
      fontSize: 13,
      fontWeight:
        "600",
      color:
        "#76594F",
    },

    filterTextSmall: {
      fontSize: 11,
    },

    filterTextActive: {
      color:
        "#FFFFFF",
    },

    // ======================================
    // FEED
    // ======================================

    feedArea: {
      flex: 1,
      width: "100%",
      maxWidth:
        layout.contentMaxWidth,
      alignSelf:
        "center",
      position:
        "relative",
    },

    feedList: {
      flex: 1,
      width: "100%",
    },

    listContent: {
      paddingBottom: 130,
    },

    cardWrapper: {
      width: "100%",
      maxWidth:
        layout.contentMaxWidth,
      alignSelf:
        "center",
    },

    cardWrapperDesktop: {
      width: "100%",
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
      paddingHorizontal: 20,
      paddingBottom: 100,
    },

    emptyCircle: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor:
        "#F1E4DC",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    emptyCircleSmall: {
      width: 74,
      height: 74,
      borderRadius: 37,
    },

    emptyLogo: {
      width: 58,
      height: 58,
    },

    emptyLogoSmall: {
      width: 48,
      height: 48,
    },

    emptyTitle: {
      fontSize: 22,
      fontWeight:
        "700",
      color:
        "#3B241C",
      marginTop: 17,
      textAlign:
        "center",
    },

    emptyTitleSmall: {
      fontSize: 20,
    },

    emptyText: {
      fontSize: 14,
      color:
        "#8A6F63",
      textAlign:
        "center",
      marginTop: 8,
      lineHeight: 21,
      maxWidth: 340,
    },

    emptyButton: {
      backgroundColor:
        "#6F4E37",
      borderRadius: 26,
      paddingHorizontal: 24,
      paddingVertical: 13,
      marginTop: 22,
    },

    emptyButtonText: {
      color:
        "#FFFFFF",
      fontSize: 14,
      fontWeight:
        "700",
    },

    // ======================================
    // FLOATING BUTTON
    // ======================================

    floatingButton: {
      position:
        "absolute",
      right: 24,
      bottom: 26,
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor:
        "#6F4E37",
      justifyContent:
        "center",
      alignItems:
        "center",

      shadowColor:
        "#000000",

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity:
        0.18,

      shadowRadius:
        7,

      elevation: 6,
    },

    floatingButtonSmall: {
      width: 52,
      height: 52,
      borderRadius: 26,
      right: 18,
      bottom: 22,
    },

    floatingButtonDesktop: {
      right: 18,
      bottom: 24,
    },

    floatingButtonText: {
      color:
        "#FFFFFF",
      fontSize: 31,
      fontWeight:
        "400",
      marginTop: -2,
    },

    floatingButtonTextSmall: {
      fontSize: 28,
    },
  });