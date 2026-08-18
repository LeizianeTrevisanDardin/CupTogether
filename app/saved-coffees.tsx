import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
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

import { CoffeeCard } from "@/components/CoffeeCard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

import type { Coffee } from "@/types/coffee";

export default function SavedCoffeesScreen() {
  const { user } = useAuth();

  const { width } =
    useWindowDimensions();

  const isSmallMobile =
    width < 380;

  const isTablet =
    width >= 768;

  const isDesktop =
    width >= 1024;

  const [
    coffees,
    setCoffees,
  ] = useState<Coffee[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // =========================================
  // LOAD SAVED COFFEES
  // =========================================

  const loadSavedCoffees =
    useCallback(async () => {
      if (!user) {
        setCoffees([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // =====================================
        // 1. GET SAVED COFFEE IDS
        // =====================================

        const {
          data: savedRows,
          error: savedError,
        } = await supabase
          .from("saved_coffees")
          .select(
            "coffee_id, created_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (savedError) {
          throw savedError;
        }

        const coffeeIds =
          (
            savedRows ?? []
          )
            .map(
              (saved) =>
                saved.coffee_id
            )
            .filter(Boolean);

        if (
          coffeeIds.length ===
          0
        ) {
          setCoffees([]);
          return;
        }

        // =====================================
        // 2. GET FULL COFFEE INFORMATION
        // =====================================

        const {
          data: coffeeRows,
          error:
            coffeesError,
        } = await supabase
          .from("coffees")
          .select(`
            id,
            user_id,
            user_name,
            coffee_shop,
            order_name,
            rating,
            thoughts,
            location,
            latitude,
            longitude,
            image_url,
            created_at,
            group_id
          `)
          .in(
            "id",
            coffeeIds
          );

        if (coffeesError) {
          throw coffeesError;
        }

        const rows =
          coffeeRows ?? [];

        // =====================================
        // 3. GET AUTHORS
        // =====================================

        const userIds = [
          ...new Set(
            rows
              .map(
                (coffee) =>
                  coffee.user_id
              )
              .filter(Boolean)
          ),
        ];

        let profileMap:
          Record<
            string,
            {
              name:
                | string
                | null;

              avatar_url:
                | string
                | null;
            }
          > = {};

        if (
          userIds.length >
          0
        ) {
          const {
            data: profiles,
            error:
              profilesError,
          } = await supabase
            .from("profiles")
            .select(
              "id, name, avatar_url"
            )
            .in(
              "id",
              userIds
            );

          if (
            profilesError
          ) {
            throw profilesError;
          }

          profileMap =
            (
              profiles ?? []
            ).reduce(
              (
                accumulator,
                profile
              ) => {
                accumulator[
                  profile.id
                ] = {
                  name:
                    profile.name ??
                    null,

                  avatar_url:
                    profile.avatar_url ??
                    null,
                };

                return accumulator;
              },
              {} as Record<
                string,
                {
                  name:
                    | string
                    | null;

                  avatar_url:
                    | string
                    | null;
                }
              >
            );
        }

        // =====================================
        // 4. PRESERVE SAVED ORDER
        // =====================================

        const coffeeMap =
          new Map(
            rows.map(
              (coffee) => [
                coffee.id,
                coffee,
              ]
            )
          );

        const sortedRows =
          coffeeIds
            .map(
              (id) =>
                coffeeMap.get(
                  id
                )
            )
            .filter(Boolean);

        // =====================================
        // 5. FORMAT FOR COFFEECARD
        // =====================================

        const formattedCoffees:
          Coffee[] =
          sortedRows.map(
            (
              coffee: any
            ) => {
              const profile =
                profileMap[
                  coffee.user_id
                ];

              return {
                id:
                  coffee.id,

                userId:
                  coffee.user_id,

                userName:
                  profile
                    ?.name ??
                  coffee.user_name ??
                  "Coffee Friend",

                userAvatarUrl:
                  profile
                    ?.avatar_url ??
                  null,

                coffeeShop:
                  coffee.coffee_shop,

                order:
                  coffee.order_name ??
                  "",

                rating:
                  coffee.rating ??
                  0,

                thoughts:
                  coffee.thoughts ??
                  "",

                location:
                  coffee.location ??
                  "",

                latitude:
                  coffee.latitude !==
                  null
                    ? Number(
                        coffee.latitude
                      )
                    : undefined,

                longitude:
                  coffee.longitude !==
                  null
                    ? Number(
                        coffee.longitude
                      )
                    : undefined,

                imageUrl:
                  coffee.image_url ??
                  undefined,

                createdAt:
                  coffee.created_at ??
                  undefined,

                groupId:
                  coffee.group_id ??
                  null,
              };
            }
          );

        setCoffees(
          formattedCoffees
        );
      } catch (
        error: any
      ) {
        console.error(
          "Error loading saved coffees:",
          error
        );

        Alert.alert(
          "Saved Coffees",
          error?.message ??
            "Could not load your saved coffees."
        );
      } finally {
        setLoading(false);
      }
    }, [user]);

  // =========================================
  // REFRESH WHEN SCREEN OPENS
  // =========================================

  useFocusEffect(
    useCallback(() => {
      loadSavedCoffees();
    }, [loadSavedCoffees])
  );

  // =========================================
  // LOADING
  // =========================================

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
          Loading saved coffees...
        </Text>
      </View>
    );
  }

  // =========================================
  // SCREEN
  // =========================================

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

        {/* HEADER ICON */}

        <View
          style={
            styles.headerIcon
          }
        >
          <Ionicons
            name="bookmark-outline"
            size={30}
            color="#6F4E37"
          />
        </View>

        {/* TITLE */}

        <Text
          style={[
            styles.title,

            isSmallMobile &&
              styles.titleSmall,
          ]}
        >
          Saved Coffees
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Coffee finds you want to remember.
        </Text>

        {/* EMPTY */}

        {coffees.length ===
        0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="bookmark-outline"
                size={38}
                color="#6F4E37"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Nothing saved yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              When you save a coffee find,
              it will appear here.
            </Text>

            <Pressable
              style={
                styles.exploreButton
              }
              onPress={() =>
                router.push(
                  "/(tabs)/explore"
                )
              }
            >
              <Text
                style={
                  styles.exploreButtonText
                }
              >
                Explore Coffees
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={
              coffees
            }
            keyExtractor={(
              item
            ) => item.id}
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
                  initiallySaved
                />
              </View>
            )}
            showsVerticalScrollIndicator={
              isDesktop
            }
            contentContainerStyle={
              styles.listContent
            }
          />
        )}
      </View>
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
      color:
        "#76594F",
      fontSize: 14,
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
        24,
      paddingTop: 60,
    },

    containerSmall: {
      paddingHorizontal:
        18,
      paddingTop: 50,
    },

    containerTablet: {
      maxWidth: 850,
    },

    containerDesktop: {
      maxWidth: 1100,
      paddingHorizontal:
        32,
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
      fontSize: 17,
      fontWeight:
        "600",
      color:
        "#6F4E37",
    },

    // ======================================
    // HEADER
    // ======================================

    headerIcon: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor:
        "#F3E9E3",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    title: {
      fontSize: 30,
      fontWeight:
        "700",
      color:
        "#3B241C",
      marginTop: 10,
    },

    titleSmall: {
      fontSize: 27,
    },

    subtitle: {
      fontSize: 15,
      color:
        "#76594F",
      marginTop: 8,
      marginBottom: 26,
    },

    // ======================================
    // LIST
    // ======================================

    listContent: {
      paddingBottom: 80,
    },

    cardWrapper: {
      width: "100%",
      alignSelf:
        "center",
      marginBottom: 18,
    },

    cardWrapperDesktop: {
      maxWidth: 900,
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
      paddingBottom: 100,
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor:
        "#F3E9E3",
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
      marginTop: 14,
    },

    emptyText: {
      fontSize: 15,
      color:
        "#76594F",
      textAlign:
        "center",
      marginTop: 8,
      lineHeight: 21,
      maxWidth: 280,
    },

    exploreButton: {
      backgroundColor:
        "#6F4E37",
      borderRadius: 30,
      paddingHorizontal: 28,
      paddingVertical: 14,
      marginTop: 22,
    },

    exploreButtonText: {
      color:
        "#FFFFFF",
      fontSize: 16,
      fontWeight:
        "600",
    },
  });