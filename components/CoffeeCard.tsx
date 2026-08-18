import {
  useCallback,
  useState,
} from "react";

import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { useCoffee } from "@/context/CoffeeContext";

import { supabase } from "@/lib/supabase";
import { layout } from "@/constants/layout";

import type { Coffee } from "@/types/coffee";

type CoffeeCardProps = {
  coffee: Coffee;
  initiallySaved?: boolean;
};

// ==========================================
// TIME AGO
// ==========================================

const getTimeAgo = (
  createdAt?: string
) => {
  if (!createdAt) {
    return "";
  }

  const createdDate =
    new Date(createdAt);

  if (
    Number.isNaN(
      createdDate.getTime()
    )
  ) {
    return "";
  }

  const now = new Date();

  const difference =
    now.getTime() -
    createdDate.getTime();

  const minutes =
    Math.floor(
      difference / 60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days}d`;
  }

  const weeks =
    Math.floor(
      days / 7
    );

  if (weeks < 5) {
    return `${weeks}w`;
  }

  return createdDate.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  );
};

// ==========================================
// COFFEE CARD
// ==========================================

export function CoffeeCard({
  coffee,
  initiallySaved = false,
}: CoffeeCardProps) {
  const { user } = useAuth();

  const {
    loadCoffees,
  } = useCoffee();

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

  const [liked, setLiked] =
    useState(false);

  const [saved, setSaved] =
    useState(initiallySaved);

  const [
    likesCount,
    setLikesCount,
  ] = useState(0);

  const [
    commentsCount,
    setCommentsCount,
  ] = useState(0);

  const [
    loadingLike,
    setLoadingLike,
  ] = useState(false);

  const [
    loadingSave,
    setLoadingSave,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    menuVisible,
    setMenuVisible,
  ] = useState(false);

  const [
    deleteConfirmVisible,
    setDeleteConfirmVisible,
  ] = useState(false);

  // ==========================================
  // OWN COFFEE
  // ==========================================

  const isOwnCoffee =
    user?.id === coffee.userId;

  // ==========================================
  // LOAD INTERACTIONS
  // ==========================================

  const loadInteractions =
    useCallback(async () => {
      if (!user) {
        return;
      }

      try {
        // LIKE COUNT

        const {
          count: likeCount,
          error: likeCountError,
        } = await supabase
          .from("coffee_likes")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "coffee_id",
            coffee.id
          );

        if (likeCountError) {
          console.log(
            "Error counting likes:",
            likeCountError
          );
        } else {
          setLikesCount(
            likeCount ?? 0
          );
        }

        // COMMENT COUNT

        const {
          count: commentCount,
          error: commentCountError,
        } = await supabase
          .from("coffee_comments")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "coffee_id",
            coffee.id
          );

        if (commentCountError) {
          console.log(
            "Error counting comments:",
            commentCountError
          );
        } else {
          setCommentsCount(
            commentCount ?? 0
          );
        }

        // CHECK LIKE

        const {
          data: likeData,
          error: likeError,
        } = await supabase
          .from("coffee_likes")
          .select("id")
          .eq(
            "coffee_id",
            coffee.id
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

        if (likeError) {
          console.log(
            "Error loading like:",
            likeError
          );
        } else {
          setLiked(
            Boolean(likeData)
          );
        }

        // CHECK SAVE

        const {
          data: saveData,
          error: saveError,
        } = await supabase
          .from("saved_coffees")
          .select("id")
          .eq(
            "coffee_id",
            coffee.id
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

        if (saveError) {
          console.log(
            "Error loading saved coffee:",
            saveError
          );
        } else {
          setSaved(
            Boolean(saveData)
          );
        }
      } catch (error) {
        console.log(
          "Error loading interactions:",
          error
        );
      }
    }, [
      coffee.id,
      user,
    ]);

  // ==========================================
  // REFRESH INTERACTIONS
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      loadInteractions();
    }, [loadInteractions])
  );

  // ==========================================
  // LIKE
  // ==========================================

  const handleLike =
    async () => {
      if (!user) {
        Alert.alert(
          "Sign in required",
          "Please sign in to like coffee finds."
        );

        return;
      }

      if (loadingLike) {
        return;
      }

      try {
        setLoadingLike(true);

        if (liked) {
          const { error } =
            await supabase
              .from(
                "coffee_likes"
              )
              .delete()
              .eq(
                "coffee_id",
                coffee.id
              )
              .eq(
                "user_id",
                user.id
              );

          if (error) {
            throw error;
          }

          setLiked(false);

          setLikesCount(
            (current) =>
              Math.max(
                0,
                current - 1
              )
          );
        } else {
          const { error } =
            await supabase
              .from(
                "coffee_likes"
              )
              .insert({
                coffee_id:
                  coffee.id,

                user_id:
                  user.id,
              });

          if (error) {
            throw error;
          }

          setLiked(true);

          setLikesCount(
            (current) =>
              current + 1
          );
        }
      } catch (error: any) {
        console.log(
          "Error changing like:",
          error
        );

        Alert.alert(
          "Like failed",
          error?.message ??
            "Could not update your like."
        );
      } finally {
        setLoadingLike(false);
      }
    };

  // ==========================================
  // SAVE
  // ==========================================

  const handleSave =
    async () => {
      if (!user) {
        Alert.alert(
          "Sign in required",
          "Please sign in to save coffee finds."
        );

        return;
      }

      if (loadingSave) {
        return;
      }

      try {
        setLoadingSave(true);

        if (saved) {
          const { error } =
            await supabase
              .from(
                "saved_coffees"
              )
              .delete()
              .eq(
                "coffee_id",
                coffee.id
              )
              .eq(
                "user_id",
                user.id
              );

          if (error) {
            throw error;
          }

          setSaved(false);
        } else {
          const { error } =
            await supabase
              .from(
                "saved_coffees"
              )
              .insert({
                coffee_id:
                  coffee.id,

                user_id:
                  user.id,
              });

          if (error) {
            throw error;
          }

          setSaved(true);
        }
      } catch (error: any) {
        console.log(
          "Error changing saved coffee:",
          error
        );

        Alert.alert(
          "Save failed",
          error?.message ??
            "Could not save this coffee."
        );
      } finally {
        setLoadingSave(false);
      }
    };

  // ==========================================
  // DELETE COFFEE
  // ==========================================

  const deleteCoffee =
    async () => {
      if (!user) {
        return;
      }

      if (
        user.id !== coffee.userId
      ) {
        Alert.alert(
          "Not allowed",
          "You can only delete your own coffee finds."
        );

        return;
      }

      if (deleting) {
        return;
      }

      try {
        setDeleting(true);

        const {
          data,
          error,
        } = await supabase
          .from("coffees")
          .delete()
          .eq(
            "id",
            coffee.id
          )
          .eq(
            "user_id",
            user.id
          )
          .select("id");

        if (error) {
          throw error;
        }

        if (
          !data ||
          data.length === 0
        ) {
          throw new Error(
            "Coffee find was not deleted."
          );
        }

        await loadCoffees();

        setDeleteConfirmVisible(false);
        setMenuVisible(false);
      } catch (error: any) {
        console.log(
          "Error deleting coffee:",
          error
        );

        Alert.alert(
          "Delete failed",
          error?.message ??
            "Could not delete this coffee find."
        );
      } finally {
        setDeleting(false);
      }
    };

  // ==========================================
  // DELETE CONFIRMATION
  // ==========================================

  const handleDeleteCoffee =
    () => {
      if (!isOwnCoffee) {
        return;
      }

      setMenuVisible(false);
      setDeleteConfirmVisible(true);
    };

  // ==========================================
  // DISPLAY DATA
  // ==========================================

  const ratingStars =
    coffee.rating > 0
      ? "★".repeat(
          coffee.rating
        )
      : "";

  const userInitial =
    coffee.userName
      ?.charAt(0)
      .toUpperCase() ||
    "C";

  const timeAgo =
    getTimeAgo(
      coffee.createdAt
    );

  const imageHeight =
    isDesktop
      ? 360
      : isTablet
      ? 320
      : isSmallMobile
      ? 210
      : 250;

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <View
      style={[
        styles.card,

        isTablet &&
          styles.cardTablet,

        isDesktop &&
          styles.cardDesktop,
      ]}
    >
      {/* ======================================
          USER HEADER
      ====================================== */}

      <View
        style={[
          styles.userHeader,

          isSmallMobile &&
            styles.userHeaderSmall,
        ]}
      >
        {coffee.userAvatarUrl ? (
          <Image
            source={{
              uri:
                coffee.userAvatarUrl,
            }}
            style={[
              styles.avatarImage,

              isSmallMobile &&
                styles.avatarImageSmall,
            ]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.avatar,

              isSmallMobile &&
                styles.avatarSmall,
            ]}
          >
            <Text
              style={[
                styles.avatarText,

                isSmallMobile &&
                  styles.avatarTextSmall,
              ]}
            >
              {userInitial}
            </Text>
          </View>
        )}

        <View
          style={
            styles.userInfo
          }
        >
          <Text
            style={[
              styles.userName,

              isSmallMobile &&
                styles.userNameSmall,
            ]}
            numberOfLines={1}
          >
            {coffee.userName ||
              "Coffee Friend"}
          </Text>

          <View
            style={
              styles.metaRow
            }
          >
            <Text
              style={[
                styles.discoveredText,

                isSmallMobile &&
                  styles.metaTextSmall,
              ]}
            >
              discovered a coffee
            </Text>

            {timeAgo ? (
              <>
                <Text
                  style={
                    styles.metaDot
                  }
                >
                  •
                </Text>

                <Text
                  style={[
                    styles.timeText,

                    isSmallMobile &&
                      styles.metaTextSmall,
                  ]}
                >
                  {timeAgo}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {isOwnCoffee ? (
          <Pressable
            style={({ pressed }) => [
              styles.moreButton,

              isSmallMobile &&
                styles.moreButtonSmall,

              pressed &&
                styles.moreButtonPressed,

              deleting &&
                styles.moreButtonDisabled,
            ]}
            onPress={() =>
              setMenuVisible(true)
            }
            disabled={deleting}
          >
            <Text
              style={[
                styles.moreButtonText,

                isSmallMobile &&
                  styles.moreButtonTextSmall,
              ]}
            >
              ⋯
            </Text>
          </Pressable>
        ) : (
          // ======================================
          // CUPTOGETHER LOGO
          // ======================================

          <View
            style={[
              styles.coffeeBadge,

              isSmallMobile &&
                styles.coffeeBadgeSmall,
            ]}
          >
            <Image
              source={require(
                "@/assets/images/CupIconApp.png"
              )}
              style={[
                styles.coffeeBadgeImage,

                isSmallMobile &&
                  styles.coffeeBadgeImageSmall,
              ]}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {/* ======================================
          DESKTOP / MOBILE CONTENT
      ====================================== */}

      {isDesktop ? (
        <View
          style={
            styles.desktopBody
          }
        >
          {/* DESKTOP PHOTO */}

          {coffee.imageUrl ? (
            <Image
              source={{
                uri:
                  coffee.imageUrl,
              }}
              style={
                styles.desktopImage
              }
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.desktopImagePlaceholder
              }
            >
              <Image
                source={require(
                  "@/assets/images/CupIconApp.png"
                )}
                style={
                  styles.desktopPlaceholderLogo
                }
                resizeMode="contain"
              />
            </View>
          )}

          {/* DESKTOP CONTENT */}

          <View
            style={
              styles.desktopContent
            }
          >
            <Text
              style={[
                styles.coffeeShop,
                styles.coffeeShopDesktop,
              ]}
            >
              {coffee.coffeeShop}
            </Text>

            {coffee.location ? (
              <View
                style={
                  styles.locationRow
                }
              >
                <Text
                  style={
                    styles.locationIcon
                  }
                >
                  📍
                </Text>

                <Text
                  style={
                    styles.locationText
                  }
                >
                  {coffee.location}
                </Text>
              </View>
            ) : null}

            {coffee.order ? (
              <View
                style={
                  styles.orderContainer
                }
              >
                <Text
                  style={
                    styles.orderLabel
                  }
                >
                  What you ordered
                </Text>

                <Text
                  style={
                    styles.orderText
                  }
                >
                  {coffee.order}
                </Text>
              </View>
            ) : null}

            {ratingStars ? (
              <View
                style={
                  styles.ratingRow
                }
              >
                <Text
                  style={
                    styles.ratingStars
                  }
                >
                  {ratingStars}
                </Text>

                <Text
                  style={
                    styles.ratingNumber
                  }
                >
                  {coffee.rating}/5
                </Text>
              </View>
            ) : null}

            {coffee.thoughts ? (
              <Text
                style={
                  styles.thoughts
                }
              >
                “{coffee.thoughts}”
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <>
          {/* MOBILE / TABLET PHOTO */}

          {coffee.imageUrl ? (
            <Image
              source={{
                uri:
                  coffee.imageUrl,
              }}
              style={[
                styles.coffeeImage,
                {
                  height:
                    imageHeight,
                },
              ]}
              resizeMode="cover"
            />
          ) : (
            // Se não tiver foto, mostra a logo
            <View
              style={[
                styles.mobileImagePlaceholder,
                {
                  height:
                    imageHeight,
                },
              ]}
            >
              <Image
                source={require(
                  "@/assets/images/CupIconApp.png"
                )}
                style={
                  styles.mobilePlaceholderLogo
                }
                resizeMode="contain"
              />
            </View>
          )}

          {/* MOBILE / TABLET CONTENT */}

          <View
            style={[
              styles.coffeeContent,

              isSmallMobile &&
                styles.coffeeContentSmall,

              isTablet &&
                styles.coffeeContentTablet,
            ]}
          >
            <Text
              style={[
                styles.coffeeShop,

                isSmallMobile &&
                  styles.coffeeShopSmall,
              ]}
            >
              {coffee.coffeeShop}
            </Text>

            {coffee.location ? (
              <View
                style={
                  styles.locationRow
                }
              >
                <Text
                  style={
                    styles.locationIcon
                  }
                >
                  📍
                </Text>

                <Text
                  style={[
                    styles.locationText,

                    isSmallMobile &&
                      styles.locationTextSmall,
                  ]}
                >
                  {coffee.location}
                </Text>
              </View>
            ) : null}

            {coffee.order ? (
              <View
                style={[
                  styles.orderContainer,

                  isSmallMobile &&
                    styles.orderContainerSmall,
                ]}
              >
                <Text
                  style={
                    styles.orderLabel
                  }
                >
                  What you ordered
                </Text>

                <Text
                  style={[
                    styles.orderText,

                    isSmallMobile &&
                      styles.orderTextSmall,
                  ]}
                >
                  {coffee.order}
                </Text>
              </View>
            ) : null}

            {ratingStars ? (
              <View
                style={
                  styles.ratingRow
                }
              >
                <Text
                  style={[
                    styles.ratingStars,

                    isSmallMobile &&
                      styles.ratingStarsSmall,
                  ]}
                >
                  {ratingStars}
                </Text>

                <Text
                  style={
                    styles.ratingNumber
                  }
                >
                  {coffee.rating}/5
                </Text>
              </View>
            ) : null}

            {coffee.thoughts ? (
              <Text
                style={[
                  styles.thoughts,

                  isSmallMobile &&
                    styles.thoughtsSmall,
                ]}
              >
                “{coffee.thoughts}”
              </Text>
            ) : null}
          </View>
        </>
      )}

      {/* ======================================
          ACTIONS
      ====================================== */}

      <View
        style={[
          styles.divider,

          isSmallMobile &&
            styles.dividerSmall,
        ]}
      />

      <View
        style={[
          styles.actions,

          isSmallMobile &&
            styles.actionsSmall,
        ]}
      >
        {/* LIKE */}

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,

              isSmallMobile &&
                styles.actionButtonSmall,

              pressed &&
                styles.actionPressed,
            ]}
            onPress={handleLike}
            disabled={loadingLike}
          >
            <Text
              style={[
                styles.actionIcon,

                isSmallMobile &&
                  styles.actionIconSmall,

                liked &&
                  styles.likeActive,
              ]}
            >
              {liked
                ? "♥"
                : "♡"}
            </Text>

            <Text
              style={[
                styles.actionText,

                isSmallMobile &&
                  styles.actionTextSmall,

                liked &&
                  styles.likeActive,
              ]}
            >
              {likesCount > 0
                ? likesCount
                : "Like"}
            </Text>
          </Pressable>
  {/* COMMENT */}

  <Pressable
    style={({ pressed }) => [
      styles.actionButton,

      isSmallMobile &&
        styles.actionButtonSmall,

      pressed &&
        styles.actionPressed,
    ]}
    onPress={() =>
      router.push({
        pathname:
          "/coffee/[id]",

        params: {
          id:
            coffee.id,
        },
      })
    }
  >
    <Ionicons
      name="chatbubble-outline"
      size={
        isSmallMobile
          ? 17
          : 20
      }
      color="#76594F"
    />

    <Text
      style={[
        styles.actionText,

        isSmallMobile &&
          styles.actionTextSmall,
      ]}
    >
      {commentsCount > 0
        ? commentsCount
        : "Comment"}
    </Text>
  </Pressable>

        {/* SAVE */}

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,

            isSmallMobile &&
              styles.actionButtonSmall,

            pressed &&
              styles.actionPressed,
          ]}
          onPress={handleSave}
          disabled={loadingSave}
        >
          <Ionicons
            name={
              saved
                ? "bookmark"
                : "bookmark-outline"
            }
            size={
              isSmallMobile
                ? 17
                : 19
            }
            color={
              saved
                ? "#B85C5C"
                : "#76594F"
            }
          />

          <Text
            style={[
              styles.actionText,

              isSmallMobile &&
                styles.actionTextSmall,

              saved &&
                styles.savedActive,
            ]}
          >
            {saved
              ? "Saved"
              : "Save"}
          </Text>
        </Pressable>
      </View>

      {/* ======================================
          MORE MENU
      ====================================== */}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setMenuVisible(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setMenuVisible(false)
          }
        >
          <Pressable
            style={styles.menuModal}
            onPress={() => {}}
          >
            <Text style={styles.menuTitle}>
              Coffee Find
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed &&
                  styles.menuItemPressed,
              ]}
              onPress={handleDeleteCoffee}
            >
              <Ionicons
                name="trash-outline"
                size={21}
                color="#B44B4B"
              />

              <Text
                style={styles.deleteMenuText}
              >
                Delete Coffee Find
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.cancelMenuButton,
                pressed &&
                  styles.menuItemPressed,
              ]}
              onPress={() =>
                setMenuVisible(false)
              }
            >
              <Text
                style={styles.cancelMenuText}
              >
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ======================================
          DELETE CONFIRMATION
      ====================================== */}

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setDeleteConfirmVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View
              style={styles.confirmIconCircle}
            >
              <Ionicons
                name="trash-outline"
                size={28}
                color="#B44B4B"
              />
            </View>

            <Text
              style={styles.confirmTitle}
            >
              Delete Coffee Find?
            </Text>

            <Text
              style={styles.confirmText}
            >
              This coffee find will be permanently
              removed. This action cannot be undone.
            </Text>

            <View
              style={styles.confirmActions}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.confirmCancelButton,
                  pressed &&
                    styles.menuItemPressed,
                ]}
                onPress={() =>
                  setDeleteConfirmVisible(false)
                }
                disabled={deleting}
              >
                <Text
                  style={styles.confirmCancelText}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.confirmDeleteButton,
                  pressed &&
                    styles.confirmDeleteButtonPressed,
                  deleting &&
                    styles.confirmDeleteButtonDisabled,
                ]}
                onPress={deleteCoffee}
                disabled={deleting}
              >
                <Text
                  style={styles.confirmDeleteText}
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles =
  StyleSheet.create({
    card: {
      width: "100%",
      maxWidth:
        layout.contentMaxWidth,
      alignSelf: "center",

      backgroundColor:
        "#FFFFFF",

      borderRadius: 22,

      borderWidth: 1,
      borderColor:
        "#EFE3DC",

      marginBottom: 18,

      overflow: "hidden",

      shadowColor:
        "#3B241C",

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.05,
      shadowRadius: 8,

      elevation: 2,
    },

    cardTablet: {
      borderRadius: 24,
    },

    cardDesktop: {
      maxWidth: 900,
      borderRadius: 24,

      shadowOpacity: 0.07,
      shadowRadius: 10,
    },

    // ======================================
    // USER HEADER
    // ======================================

    userHeader: {
      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 18,
      paddingTop: 17,
      paddingBottom: 14,
    },

    userHeaderSmall: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 12,
    },

    avatar: {
      width: 44,
      height: 44,

      borderRadius: 22,

      backgroundColor:
        "#6F4E37",

      alignItems: "center",
      justifyContent:
        "center",
    },

    avatarSmall: {
      width: 38,
      height: 38,

      borderRadius: 19,
    },

    avatarImage: {
      width: 44,
      height: 44,

      borderRadius: 22,

      backgroundColor:
        "#F3E9E3",
    },

    avatarImageSmall: {
      width: 38,
      height: 38,

      borderRadius: 19,
    },

    avatarText: {
      color: "#FFFFFF",

      fontSize: 18,
      fontWeight: "700",
    },

    avatarTextSmall: {
      fontSize: 16,
    },

    userInfo: {
      flex: 1,
      marginLeft: 12,
    },

    userName: {
      fontSize: 15,
      fontWeight: "700",

      color: "#3B241C",
    },

    userNameSmall: {
      fontSize: 14,
    },

    metaRow: {
      flexDirection: "row",

      alignItems: "center",

      flexWrap: "wrap",

      marginTop: 3,
    },

    discoveredText: {
      fontSize: 12,

      color: "#9A8175",
    },

    metaDot: {
      fontSize: 12,

      color: "#B9A49A",

      marginHorizontal: 5,
    },

    timeText: {
      fontSize: 12,

      color: "#9A8175",
    },

    metaTextSmall: {
      fontSize: 11,
    },

    // ======================================
    // CUPTOGETHER LOGO BADGE
    // ======================================

    coffeeBadge: {
      width: 42,
      height: 42,

      borderRadius: 21,

      backgroundColor:
        "#FFF5EF",

      justifyContent:
        "center",

      alignItems: "center",
    },

    coffeeBadgeSmall: {
      width: 36,
      height: 36,

      borderRadius: 18,
    },

    coffeeBadgeImage: {
      width: 32,
      height: 32,
    },

    coffeeBadgeImageSmall: {
      width: 27,
      height: 27,
    },

    // ======================================
    // MORE
    // ======================================

    moreButton: {
      width: 36,
      height: 36,

      borderRadius: 18,

      backgroundColor:
        "#F7EFEA",

      justifyContent:
        "center",

      alignItems: "center",
    },

    moreButtonSmall: {
      width: 32,
      height: 32,

      borderRadius: 16,
    },

    moreButtonPressed: {
      backgroundColor:
        "#EADCD3",
    },

    moreButtonDisabled: {
      opacity: 0.5,
    },

    moreButtonText: {
      fontSize: 25,
      lineHeight: 25,

      color: "#76594F",

      fontWeight: "700",

      marginTop: -5,
    },

    moreButtonTextSmall: {
      fontSize: 22,
    },

    // ======================================
    // DESKTOP
    // ======================================

    desktopBody: {
      flexDirection: "row",

      width: "100%",

      minHeight: 300,
    },

    desktopImage: {
      width: "48%",

      minHeight: 300,

      backgroundColor:
        "#F3E9E3",
    },

    desktopImagePlaceholder: {
      width: "48%",

      minHeight: 300,

      backgroundColor:
        "#F7EFEA",

      justifyContent:
        "center",

      alignItems: "center",
    },

    desktopPlaceholderLogo: {
      width: 120,
      height: 120,
    },

    desktopContent: {
      flex: 1,

      paddingHorizontal: 28,
      paddingVertical: 26,

      justifyContent:
        "center",
    },

    // ======================================
    // MOBILE IMAGE
    // ======================================

    coffeeImage: {
      width: "100%",

      backgroundColor:
        "#F3E9E3",
    },

    mobileImagePlaceholder: {
      width: "100%",

      backgroundColor:
        "#F7EFEA",

      justifyContent:
        "center",

      alignItems: "center",
    },

    mobilePlaceholderLogo: {
      width: 90,
      height: 90,
    },

    // ======================================
    // CONTENT
    // ======================================

    coffeeContent: {
      paddingHorizontal: 18,
      paddingTop: 17,
    },

    coffeeContentSmall: {
      paddingHorizontal: 14,
      paddingTop: 14,
    },

    coffeeContentTablet: {
      paddingHorizontal: 22,
      paddingTop: 20,
    },

    coffeeShop: {
      fontSize: 23,

      fontWeight: "800",

      color: "#3B241C",

      letterSpacing: -0.3,
    },

    coffeeShopSmall: {
      fontSize: 20,
    },

    coffeeShopDesktop: {
      fontSize: 26,
    },

    // ======================================
    // LOCATION
    // ======================================

    locationRow: {
      flexDirection: "row",

      alignItems:
        "flex-start",

      marginTop: 9,
    },

    locationIcon: {
      fontSize: 14,

      marginRight: 5,
      marginTop: 1,
    },

    locationText: {
      flex: 1,

      fontSize: 13,
      lineHeight: 18,

      color: "#8A6F63",
    },

    locationTextSmall: {
      fontSize: 12,
      lineHeight: 17,
    },

    // ======================================
    // ORDER
    // ======================================

    orderContainer: {
      alignSelf:
        "flex-start",

      marginTop: 13,

      backgroundColor:
        "#F7EFEA",

      borderRadius: 12,

      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    orderContainerSmall: {
      marginTop: 11,

      paddingHorizontal: 10,
      paddingVertical: 7,
    },

    orderLabel: {
      fontSize: 9,

      fontWeight: "800",

      color: "#A18476",

      letterSpacing: 1,
    },

    orderText: {
      fontSize: 15,

      fontWeight: "600",

      color: "#6F4E37",

      marginTop: 2,
    },

    orderTextSmall: {
      fontSize: 14,
    },

    // ======================================
    // RATING
    // ======================================

    ratingRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 13,

      flexWrap: "wrap",
    },

    ratingStars: {
      fontSize: 18,

      color: "#D99A32",

      letterSpacing: 1,
    },

    ratingStarsSmall: {
      fontSize: 16,
    },

    ratingNumber: {
      fontSize: 12,

      color: "#9A8175",

      marginLeft: 8,

      fontWeight: "600",
    },

    // ======================================
    // THOUGHTS
    // ======================================

    thoughts: {
      fontSize: 15,

      color: "#76594F",

      lineHeight: 22,

      marginTop: 14,

      fontStyle: "italic",
    },

    thoughtsSmall: {
      fontSize: 14,

      lineHeight: 20,

      marginTop: 12,
    },

    // ======================================
    // MODALS
    // ======================================

    modalOverlay: {
      flex: 1,

      backgroundColor:
        "rgba(59, 36, 28, 0.38)",

      justifyContent:
        "center",

      alignItems: "center",

      paddingHorizontal: 24,
    },

    menuModal: {
      width: "100%",
      maxWidth: 420,

      backgroundColor:
        "#FFF9F5",

      borderRadius: 24,

      padding: 18,

      shadowColor:
        "#3B241C",

      shadowOffset: {
        width: 0,
        height: 6,
      },

      shadowOpacity: 0.16,
      shadowRadius: 18,

      elevation: 8,
    },

    menuTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#3B241C",

      marginBottom: 12,
    },

    menuItem: {
      minHeight: 52,

      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 14,

      borderRadius: 16,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,
      borderColor:
        "#F0E6E0",

      gap: 10,
    },

    menuItemPressed: {
      opacity: 0.72,
    },

    deleteMenuText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#B44B4B",
    },

    cancelMenuButton: {
      minHeight: 48,

      justifyContent:
        "center",

      alignItems: "center",

      marginTop: 10,

      borderRadius: 16,
    },

    cancelMenuText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#6F4E37",
    },

    confirmModal: {
      width: "100%",
      maxWidth: 430,

      backgroundColor:
        "#FFF9F5",

      borderRadius: 26,

      paddingHorizontal: 24,
      paddingVertical: 26,

      alignItems: "center",

      shadowColor:
        "#3B241C",

      shadowOffset: {
        width: 0,
        height: 6,
      },

      shadowOpacity: 0.16,
      shadowRadius: 18,

      elevation: 8,
    },

    confirmIconCircle: {
      width: 58,
      height: 58,

      borderRadius: 29,

      backgroundColor:
        "#F8E7E4",

      justifyContent:
        "center",

      alignItems: "center",
    },

    confirmTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#3B241C",

      marginTop: 16,

      textAlign: "center",
    },

    confirmText: {
      fontSize: 14,
      lineHeight: 21,
      color: "#76594F",

      textAlign: "center",

      marginTop: 8,
    },

    confirmActions: {
      width: "100%",

      flexDirection: "row",

      gap: 10,

      marginTop: 22,
    },

    confirmCancelButton: {
      flex: 1,

      minHeight: 48,

      borderRadius: 24,

      borderWidth: 1,
      borderColor:
        "#DCCBC1",

      justifyContent:
        "center",

      alignItems: "center",

      backgroundColor:
        "#FFFFFF",
    },

    confirmCancelText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#6F4E37",
    },

    confirmDeleteButton: {
      flex: 1,

      minHeight: 48,

      borderRadius: 24,

      justifyContent:
        "center",

      alignItems: "center",

      backgroundColor:
        "#B44B4B",
    },

    confirmDeleteButtonPressed: {
      opacity: 0.84,
    },

    confirmDeleteButtonDisabled: {
      opacity: 0.55,
    },

    confirmDeleteText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },

    // ======================================
    // ACTIONS
    // ======================================

    divider: {
      height: 1,

      backgroundColor:
        "#F1E8E3",

      marginHorizontal: 18,

      marginTop: 18,
    },

    dividerSmall: {
      marginHorizontal: 14,

      marginTop: 15,
    },

    actions: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      alignItems: "center",

      paddingHorizontal: 10,
      paddingVertical: 9,
    },

    actionsSmall: {
      paddingHorizontal: 4,
      paddingVertical: 7,
    },

    actionButton: {
      flex: 1,

      minHeight: 38,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      paddingHorizontal: 10,
      paddingVertical: 8,

      borderRadius: 18,

      gap: 6,
    },

    actionButtonSmall: {
      minHeight: 34,

      paddingHorizontal: 4,

      gap: 4,
    },

    actionPressed: {
      backgroundColor:
        "#FAF2ED",
    },

    actionIcon: {
      fontSize: 17,

      color: "#76594F",
    },

    actionIconSmall: {
      fontSize: 15,
    },

    actionText: {
      fontSize: 13,

      color: "#76594F",

      fontWeight: "600",
    },

    actionTextSmall: {
      fontSize: 11,
    },

    likeActive: {
      color: "#B85C5C",
    },

    savedActive: {
      color: "#B85C5C",

      fontWeight: "700",
    },
  });