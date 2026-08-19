import {
  useCallback,
  useState,
} from "react";

import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
  currentGroupId?: string;

  onRemovedFromGroup?: (
    coffeeId: string,
    groupId: string
  ) => void;
};

type ShareGroup = {
  id: string;
  name: string;
  avatarUrl: string | null;
  alreadyShared: boolean;
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
  currentGroupId,
  onRemovedFromGroup,
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

  const [
    shareModalVisible,
    setShareModalVisible,
  ] = useState(false);

  const [
    shareGroups,
    setShareGroups,
  ] = useState<ShareGroup[]>([]);

  const [
    loadingShareGroups,
    setLoadingShareGroups,
  ] = useState(false);

  const [
    sharingGroupId,
    setSharingGroupId,
  ] = useState<string | null>(null);

  const [
    removeConfirmVisible,
    setRemoveConfirmVisible,
  ] = useState(false);

  const [
    groupToRemove,
    setGroupToRemove,
  ] = useState<ShareGroup | null>(null);

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
  // SHARE TO GROUP
  // ==========================================

  const loadShareGroups =
    async () => {
      if (!user) {
        return;
      }

      try {
        setLoadingShareGroups(true);

        const {
          data: memberships,
          error: membershipsError,
        } = await supabase
          .from("group_members")
          .select("group_id")
          .eq(
            "user_id",
            user.id
          );

        if (membershipsError) {
          throw membershipsError;
        }

        const groupIds =
          (memberships ?? [])
            .map(
              (membership) =>
                membership.group_id
            )
            .filter(
              (groupId): groupId is string =>
                Boolean(groupId)
            );

        if (groupIds.length === 0) {
          setShareGroups([]);
          return;
        }

        const {
          data: groupsData,
          error: groupsError,
        } = await supabase
          .from("groups")
          .select(
            "id, name, avatar_url"
          )
          .in(
            "id",
            groupIds
          )
          .order(
            "name",
            {
              ascending: true,
            }
          );

        if (groupsError) {
          throw groupsError;
        }

        const {
          data: existingShares,
          error: sharesError,
        } = await supabase
          .from(
            "coffee_group_shares"
          )
          .select("group_id")
          .eq(
            "coffee_id",
            coffee.id
          )
          .in(
            "group_id",
            groupIds
          );

        if (sharesError) {
          throw sharesError;
        }

        const sharedGroupIds =
          new Set(
            (existingShares ?? []).map(
              (share) =>
                share.group_id
            )
          );

        const formattedGroups: ShareGroup[] =
          (groupsData ?? []).map(
            (group) => ({
              id: group.id,
              name:
                group.name ??
                "Coffee Group",
              avatarUrl:
                group.avatar_url ??
                null,
              alreadyShared:
                sharedGroupIds.has(
                  group.id
                ),
            })
          );

        setShareGroups(
          formattedGroups
        );
      } catch (error: any) {
        console.log(
          "Error loading groups for sharing:",
          error
        );

        Alert.alert(
          "Could not load groups",
          error?.message ??
            "Please try again."
        );
      } finally {
        setLoadingShareGroups(false);
      }
    };

  const handleOpenShareModal =
    async () => {
      if (!user) {
        Alert.alert(
          "Sign in required",
          "Please sign in to share a Coffee Find."
        );

        return;
      }

      if (!isOwnCoffee) {
        return;
      }

      setMenuVisible(false);
      setShareModalVisible(true);

      await loadShareGroups();
    };

  const handleShareToGroup =
    async (groupId: string) => {
      if (!user) {
        return;
      }

      if (sharingGroupId) {
        return;
      }

      const selectedGroup =
        shareGroups.find(
          (group) =>
            group.id === groupId
        );

      if (
        selectedGroup?.alreadyShared
      ) {
        return;
      }

      try {
        setSharingGroupId(
          groupId
        );

        const { error } =
          await supabase
            .from(
              "coffee_group_shares"
            )
            .insert({
              coffee_id:
                coffee.id,
              group_id:
                groupId,
              shared_by:
                user.id,
            });

        if (
          error &&
          error.code !== "23505"
        ) {
          throw error;
        }

        setShareGroups(
          (current) =>
            current.map(
              (group) =>
                group.id === groupId
                  ? {
                      ...group,
                      alreadyShared: true,
                    }
                  : group
            )
        );
      } catch (error: any) {
        console.log(
          "Error sharing coffee to group:",
          error
        );

        Alert.alert(
          "Share failed",
          error?.message ??
            "Could not share this Coffee Find with the group."
        );
      } finally {
        setSharingGroupId(null);
      }
    };

  // ==========================================
  // REMOVE COFFEE FROM GROUP
  // ==========================================

  const handleRemoveFromGroup =
    async (groupId: string) => {
      if (!user) {
        return;
      }

      if (sharingGroupId) {
        return;
      }

      try {
        setSharingGroupId(
          groupId
        );

        const { error } =
          await supabase
            .from(
              "coffee_group_shares"
            )
            .delete()
            .eq(
              "coffee_id",
              coffee.id
            )
            .eq(
              "group_id",
              groupId
            )
            .eq(
              "shared_by",
              user.id
            );

        if (error) {
          throw error;
        }

        onRemovedFromGroup?.(
          coffee.id,
          groupId
        );

        setShareGroups(
          (current) =>
            current.map(
              (group) =>
                group.id === groupId
                  ? {
                      ...group,
                      alreadyShared: false,
                    }
                  : group
            )
        );
      } catch (error: any) {
        console.log(
          "Error removing coffee from group:",
          error
        );

        Alert.alert(
          "Remove failed",
          error?.message ??
            "Could not remove this Coffee Find from the group."
        );
      } finally {
        setSharingGroupId(null);
      }
    };

  const handleGroupPress = (
    groupId: string
  ) => {
    const selectedGroup =
      shareGroups.find(
        (group) =>
          group.id === groupId
      );

    if (!selectedGroup) {
      return;
    }

    if (
      !selectedGroup.alreadyShared
    ) {
      handleShareToGroup(
        groupId
      );

      return;
    }

    setGroupToRemove(
      selectedGroup
    );

    setRemoveConfirmVisible(
      true
    );
  };

  const confirmRemoveFromGroup =
    async () => {
      if (!groupToRemove) {
        return;
      }

      const groupId =
        groupToRemove.id;

      setRemoveConfirmVisible(
        false
      );

      await handleRemoveFromGroup(
        groupId
      );

      setGroupToRemove(
        null
      );
    };

  // ==========================================
  // REMOVE FROM CURRENT GROUP
  // ==========================================

  const handleOpenCurrentGroupRemove =
    async () => {
      if (
        !user ||
        !currentGroupId
      ) {
        return;
      }

      setMenuVisible(false);

      try {
        const {
          data: shareData,
          error: shareError,
        } = await supabase
          .from(
            "coffee_group_shares"
          )
          .select(
            "group_id"
          )
          .eq(
            "coffee_id",
            coffee.id
          )
          .eq(
            "group_id",
            currentGroupId
          )
          .maybeSingle();

        if (shareError) {
          throw shareError;
        }

        if (!shareData) {
          Alert.alert(
            "Coffee Find belongs to this group",
            "This Coffee Find was created directly inside this group, so it cannot be removed using the Share option."
          );

          return;
        }

        const {
          data: groupData,
          error: groupError,
        } = await supabase
          .from("groups")
          .select(
            "id, name, avatar_url"
          )
          .eq(
            "id",
            currentGroupId
          )
          .maybeSingle();

        if (groupError) {
          throw groupError;
        }

        setGroupToRemove({
          id: currentGroupId,
          name:
            groupData?.name ??
            "this group",
          avatarUrl:
            groupData?.avatar_url ??
            null,
          alreadyShared: true,
        });

        setRemoveConfirmVisible(
          true
        );
      } catch (error: any) {
        console.log(
          "Error preparing group removal:",
          error
        );

        Alert.alert(
          "Could not remove from group",
          error?.message ??
            "Please try again."
        );
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

            {currentGroupId ? (
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed &&
                    styles.menuItemPressed,
                ]}
                onPress={
                  handleOpenCurrentGroupRemove
                }
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={21}
                  color="#B44B4B"
                />

                <Text
                  style={styles.removeGroupMenuText}
                >
                  Remove from Group
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed &&
                    styles.menuItemPressed,
                ]}
                onPress={
                  handleOpenShareModal
                }
              >
                <Ionicons
                  name="share-social-outline"
                  size={21}
                  color="#6F4E37"
                />

                <Text
                  style={styles.shareMenuText}
                >
                  Share to Group
                </Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                styles.deleteMenuItem,
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
          SHARE TO GROUP MODAL
      ====================================== */}

      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShareModalVisible(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setShareModalVisible(false)
          }
        >
          <Pressable
            style={styles.shareModal}
            onPress={() => {}}
          >
            <View style={styles.shareHeader}>
              <View
                style={styles.shareIconCircle}
              >
                <Ionicons
                  name="share-social-outline"
                  size={24}
                  color="#6F4E37"
                />
              </View>

              <View
                style={styles.shareHeaderText}
              >
                <Text
                  style={styles.shareTitle}
                >
                  Share to Group
                </Text>

                <Text
                  style={styles.shareSubtitle}
                >
                  Choose where you want to share this Coffee Find.
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.shareCloseButton,
                  pressed &&
                    styles.menuItemPressed,
                ]}
                onPress={() =>
                  setShareModalVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#76594F"
                />
              </Pressable>
            </View>

            {loadingShareGroups ? (
              <View style={styles.shareEmpty}>
                <Image
                  source={require(
                    "@/assets/images/CupIconApp.png"
                  )}
                  style={styles.shareLoadingLogo}
                  resizeMode="contain"
                />

                <Text
                  style={styles.shareEmptyText}
                >
                  Loading your groups...
                </Text>
              </View>
            ) : shareGroups.length === 0 ? (
              <View style={styles.shareEmpty}>
                <View
                  style={styles.shareEmptyIcon}
                >
                  <Ionicons
                    name="people-outline"
                    size={30}
                    color="#8A6F63"
                  />
                </View>

                <Text
                  style={styles.shareEmptyTitle}
                >
                  No groups yet
                </Text>

                <Text
                  style={styles.shareEmptyText}
                >
                  Create or join a group before sharing Coffee Finds.
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.goToGroupsButton,
                    pressed &&
                      styles.menuItemPressed,
                  ]}
                  onPress={() => {
                    setShareModalVisible(false);
                    router.push(
                      "/(tabs)/groups"
                    );
                  }}
                >
                  <Text
                    style={styles.goToGroupsButtonText}
                  >
                    Go to Groups
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                style={styles.shareGroupList}
                contentContainerStyle={
                  styles.shareGroupListContent
                }
                showsVerticalScrollIndicator={false}
              >
                {shareGroups.map((group) => {
                  const sharing =
                    sharingGroupId === group.id;

                  return (
                    <Pressable
                      key={group.id}
                      style={({ pressed }) => [
                        styles.shareGroupItem,
                        group.alreadyShared &&
                          styles.shareGroupItemShared,
                        pressed &&
                          styles.menuItemPressed,
                      ]}
                      onPress={() =>
                        handleGroupPress(
                          group.id
                        )
                      }
                      disabled={
                        Boolean(sharingGroupId)
                      }
                    >
                      {group.avatarUrl ? (
                        <Image
                          source={{
                            uri: group.avatarUrl,
                          }}
                          style={styles.shareGroupAvatar}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={
                            styles.shareGroupAvatarFallback
                          }
                        >
                          <Ionicons
                            name="people"
                            size={22}
                            color="#6F4E37"
                          />
                        </View>
                      )}

                      <View
                        style={styles.shareGroupInfo}
                      >
                        <Text
                          style={styles.shareGroupName}
                          numberOfLines={1}
                        >
                          {group.name}
                        </Text>

                        <Text
                          style={styles.shareGroupStatus}
                        >
                          {sharing
                            ? group.alreadyShared
                              ? "Removing..."
                              : "Sharing..."
                            : group.alreadyShared
                            ? "Shared • Tap to remove"
                            : "Share Coffee Find"}
                        </Text>
                      </View>

                      {sharing ? (
                        <Text
                          style={styles.sharingText}
                        >
                          ...
                        </Text>
                      ) : group.alreadyShared ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={25}
                          color="#6F4E37"
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={21}
                          color="#A48B7F"
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ======================================
          REMOVE FROM GROUP CONFIRMATION
      ====================================== */}

      <Modal
        visible={removeConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRemoveConfirmVisible(false);
          setGroupToRemove(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setRemoveConfirmVisible(false);
            setGroupToRemove(null);
          }}
        >
          <Pressable
            style={styles.removeConfirmModal}
            onPress={() => {}}
          >
            <View style={styles.removeConfirmIconCircle}>
              <Ionicons
                name="remove-circle-outline"
                size={30}
                color="#B44B4B"
              />
            </View>

            <Text style={styles.removeConfirmTitle}>
              Remove from group?
            </Text>

            <Text style={styles.removeConfirmText}>
              Remove this Coffee Find from{" "}
              <Text style={styles.removeConfirmGroupName}>
                {groupToRemove?.name ?? "this group"}
              </Text>
              ?
            </Text>

            <Text style={styles.removeConfirmHint}>
              The Coffee Find will stay in your Feed. It will only be
              removed from this group.
            </Text>

            <View style={styles.removeConfirmActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.removeCancelButton,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => {
                  setRemoveConfirmVisible(false);
                  setGroupToRemove(null);
                }}
                disabled={Boolean(sharingGroupId)}
              >
                <Text style={styles.removeCancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.removeButtonPressed,
                  Boolean(sharingGroupId) &&
                    styles.removeButtonDisabled,
                ]}
                onPress={confirmRemoveFromGroup}
                disabled={Boolean(sharingGroupId)}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.removeButtonText}>
                  Remove
                </Text>
              </Pressable>
            </View>
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

    shareMenuText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#6F4E37",
    },

    removeGroupMenuText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#B44B4B",
    },

    deleteMenuItem: {
      marginTop: 8,
    },

    // ======================================
    // SHARE MODAL
    // ======================================

    shareModal: {
      width: "100%",
      maxWidth: 460,
      maxHeight: "75%",
      backgroundColor: "#FFF9F5",
      borderRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 18,
      shadowColor: "#3B241C",
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 8,
    },

    shareHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 18,
    },

    shareIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#F3E9E3",
      justifyContent: "center",
      alignItems: "center",
    },

    shareHeaderText: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },

    shareTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: "#3B241C",
    },

    shareSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: "#8A6F63",
      marginTop: 3,
    },

    shareCloseButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "#F7EFEA",
      justifyContent: "center",
      alignItems: "center",
    },

    shareGroupList: {
      maxHeight: 390,
    },

    shareGroupListContent: {
      gap: 9,
      paddingBottom: 4,
    },

    shareGroupItem: {
      width: "100%",
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EFE3DC",
      borderRadius: 18,
      paddingHorizontal: 13,
      paddingVertical: 10,
    },

    shareGroupItemShared: {
      backgroundColor: "#F7EFEA",
    },

    shareGroupAvatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "#F3E9E3",
    },

    shareGroupAvatarFallback: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "#F1E4DC",
      justifyContent: "center",
      alignItems: "center",
    },

    shareGroupInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },

    shareGroupName: {
      fontSize: 15,
      fontWeight: "700",
      color: "#3B241C",
    },

    shareGroupStatus: {
      fontSize: 12,
      color: "#9A8175",
      marginTop: 3,
    },

    sharingText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#6F4E37",
    },

    shareEmpty: {
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 28,
    },

    shareEmptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#F3E9E3",
      justifyContent: "center",
      alignItems: "center",
    },

    shareLoadingLogo: {
      width: 55,
      height: 55,
      marginBottom: 8,
    },

    shareEmptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#3B241C",
      marginTop: 13,
    },

    shareEmptyText: {
      fontSize: 13,
      lineHeight: 19,
      color: "#8A6F63",
      textAlign: "center",
      marginTop: 6,
      maxWidth: 280,
    },

    goToGroupsButton: {
      backgroundColor: "#6F4E37",
      borderRadius: 22,
      paddingHorizontal: 22,
      paddingVertical: 11,
      marginTop: 18,
    },

    goToGroupsButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
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

    // ======================================
    // REMOVE FROM GROUP CONFIRMATION
    // ======================================

    removeConfirmModal: {
      width: "100%",
      maxWidth: 430,

      backgroundColor: "#FFF9F5",

      borderRadius: 26,

      paddingHorizontal: 24,
      paddingVertical: 26,

      alignItems: "center",

      shadowColor: "#3B241C",

      shadowOffset: {
        width: 0,
        height: 6,
      },

      shadowOpacity: 0.16,
      shadowRadius: 18,

      elevation: 8,
    },

    removeConfirmIconCircle: {
      width: 62,
      height: 62,

      borderRadius: 31,

      backgroundColor: "#F8E7E4",

      justifyContent: "center",
      alignItems: "center",
    },

    removeConfirmTitle: {
      fontSize: 21,
      fontWeight: "800",
      color: "#3B241C",

      marginTop: 16,

      textAlign: "center",
    },

    removeConfirmText: {
      fontSize: 15,
      lineHeight: 22,
      color: "#76594F",

      textAlign: "center",

      marginTop: 9,
    },

    removeConfirmGroupName: {
      color: "#3B241C",
      fontWeight: "700",
    },

    removeConfirmHint: {
      fontSize: 13,
      lineHeight: 19,
      color: "#A48B7F",

      textAlign: "center",

      marginTop: 8,

      maxWidth: 340,
    },

    removeConfirmActions: {
      width: "100%",

      flexDirection: "row",

      gap: 10,

      marginTop: 24,
    },

    removeCancelButton: {
      flex: 1,

      minHeight: 50,

      borderRadius: 25,

      borderWidth: 1,
      borderColor: "#DCCBC1",

      justifyContent: "center",
      alignItems: "center",

      backgroundColor: "#FFFFFF",
    },

    removeCancelText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#6F4E37",
    },

    removeButton: {
      flex: 1,

      minHeight: 50,

      borderRadius: 25,

      flexDirection: "row",
      gap: 7,

      justifyContent: "center",
      alignItems: "center",

      backgroundColor: "#B44B4B",
    },

    removeButtonPressed: {
      opacity: 0.84,
    },

    removeButtonDisabled: {
      opacity: 0.55,
    },

    removeButtonText: {
      color: "#FFFFFF",

      fontSize: 15,
      fontWeight: "700",
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