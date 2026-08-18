import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { layout } from "@/constants/layout";

// ==========================================
// TYPES
// ==========================================

type Coffee = {
  id: string;

  user_id: string | null;
  user_name: string | null;

  coffee_shop: string;

  order_name: string | null;

  rating: number | null;

  thoughts: string | null;

  location: string | null;

  latitude: number | null;

  longitude: number | null;

  image_url: string | null;

  created_at: string | null;
};

type Comment = {
  id: string;

  coffee_id: string;

  user_id: string;

  user_name: string;

  comment: string;

  created_at: string;
};

// ==========================================
// TIME AGO
// ==========================================

const getTimeAgo = (
  createdAt?: string | null
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

  const now =
    new Date();

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
// SCREEN
// ==========================================

export default function CoffeeDetailsScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

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

  const horizontalPadding =
    isTablet
      ? layout.tabletPadding
      : isSmallMobile
      ? 16
      : layout.mobilePadding;

  const imageHeight =
    isDesktop
      ? 420
      : isTablet
      ? 360
      : isSmallMobile
      ? 230
      : 280;

  // ==========================================
  // STATE
  // ==========================================

  const [
    coffee,
    setCoffee,
  ] =
    useState<Coffee | null>(
      null
    );

  const [
    comments,
    setComments,
  ] =
    useState<Comment[]>([]);

  const [
    comment,
    setComment,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  // ==========================================
  // LOAD COFFEE
  // ==========================================

  const loadCoffee =
    useCallback(async () => {
      if (!id) {
        return;
      }

      const {
        data,
        error,
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
          created_at
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error(
          "Error loading coffee:",
          error
        );

        Alert.alert(
          "Coffee error",
          error.message
        );

        return;
      }

      setCoffee(
        data as Coffee
      );
    }, [id]);

  // ==========================================
  // LOAD COMMENTS
  // ==========================================

  const loadComments =
    useCallback(async () => {
      if (!id) {
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "coffee_comments"
        )
        .select(`
          id,
          coffee_id,
          user_id,
          user_name,
          comment,
          created_at
        `)
        .eq(
          "coffee_id",
          id
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          "Error loading comments:",
          error
        );

        Alert.alert(
          "Comments error",
          error.message
        );

        return;
      }

      setComments(
        data ?? []
      );
    }, [id]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const loadPage =
      async () => {
        try {
          setLoading(true);

          await Promise.all([
            loadCoffee(),
            loadComments(),
          ]);
        } finally {
          setLoading(false);
        }
      };

    loadPage();
  }, [
    loadCoffee,
    loadComments,
  ]);

  // ==========================================
  // ADD COMMENT
  // ==========================================

  const handleAddComment =
    async () => {
      if (!user) {
        Alert.alert(
          "Sign in required",
          "Please sign in to comment."
        );

        return;
      }

      if (
        !comment.trim()
      ) {
        return;
      }

      try {
        setSending(true);

        const {
          data: profile,
          error:
            profileError,
        } = await supabase
          .from("profiles")
          .select("name")
          .eq(
            "id",
            user.id
          )
          .single();

        if (
          profileError
        ) {
          throw profileError;
        }

        const {
          error,
        } = await supabase
          .from(
            "coffee_comments"
          )
          .insert({
            coffee_id:
              id,

            user_id:
              user.id,

            user_name:
              profile?.name ??
              "Coffee Friend",

            comment:
              comment.trim(),
          });

        if (error) {
          throw error;
        }

        setComment("");

        await loadComments();
      } catch (
        error: any
      ) {
        console.error(
          "Error adding comment:",
          error
        );

        Alert.alert(
          "Comment failed",
          error?.message ??
            "Could not add your comment."
        );
      } finally {
        setSending(false);
      }
    };

  // ==========================================
  // DELETE COMMENT
  // ==========================================

  const handleDeleteComment =
    (
      selectedComment: Comment
    ) => {
      if (
        !user ||
        selectedComment.user_id !==
          user.id
      ) {
        return;
      }

      Alert.alert(
        "Delete Comment",
        "Do you want to delete this comment?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Delete",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  const {
                    error,
                  } =
                    await supabase
                      .from(
                        "coffee_comments"
                      )
                      .delete()
                      .eq(
                        "id",
                        selectedComment.id
                      )
                      .eq(
                        "user_id",
                        user.id
                      );

                  if (error) {
                    throw error;
                  }

                  setComments(
                    (
                      currentComments
                    ) =>
                      currentComments.filter(
                        (
                          item
                        ) =>
                          item.id !==
                          selectedComment.id
                      )
                  );
                } catch (
                  error: any
                ) {
                  Alert.alert(
                    "Delete failed",
                    error?.message ??
                      "Could not delete the comment."
                  );
                }
              },
          },
        ]
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
        <ActivityIndicator
          size="large"
          color="#6F4E37"
        />
      </View>
    );
  }

  // ==========================================
  // DATA
  // ==========================================

  const userInitial =
    coffee?.user_name
      ?.charAt(0)
      .toUpperCase() ??
    "C";

  const timeAgo =
    getTimeAgo(
      coffee?.created_at
    );

  const ratingStars =
    coffee?.rating
      ? "★".repeat(
          coffee.rating
        )
      : "";

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
      <View
        style={[
          styles.page,

          {
            paddingHorizontal:
              horizontalPadding,
          },
        ]}
      >
        {/* ==================================
            BACK
        ================================== */}

        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
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

        {/* ==================================
            MAIN CONTENT
        ================================== */}

        <FlatList
          data={comments}
          keyExtractor={(
            item
          ) => item.id}
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.listContent
          }
          ListHeaderComponent={
            <>
              {/* USER */}

              <View
                style={
                  styles.userHeader
                }
              >
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
                    {userInitial}
                  </Text>
                </View>

                <View
                  style={
                    styles.userInfo
                  }
                >
                  <Text
                    style={
                      styles.userName
                    }
                  >
                    {coffee?.user_name ??
                      "Coffee Friend"}
                  </Text>

                  <View
                    style={
                      styles.metaRow
                    }
                  >
                    <Text
                      style={
                        styles.metaText
                      }
                    >
                      shared a coffee find
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
                          style={
                            styles.metaText
                          }
                        >
                          {timeAgo}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* IMAGE */}

              {coffee?.image_url ? (
                <Image
                  source={{
                    uri:
                      coffee.image_url,
                  }}
                  style={[
                    styles.heroImage,
                    {
                      height:
                        imageHeight,
                    },
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.noImage,

                    {
                      height:
                        isSmallMobile
                          ? 170
                          : 200,
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.noImageEmoji
                    }
                  >
                    ☕️
                  </Text>

                  <Text
                    style={
                      styles.noImageText
                    }
                  >
                    Coffee Find
                  </Text>
                </View>
              )}

              {/* COFFEE DETAILS */}

              <View
                style={
                  styles.detailsCard
                }
              >
                <Text
                  style={[
                    styles.title,

                    isSmallMobile &&
                      styles.titleSmall,

                    isDesktop &&
                      styles.titleDesktop,
                  ]}
                >
                  {coffee?.coffee_shop ??
                    "Coffee Find"}
                </Text>

                {/* LOCATION */}

                {coffee?.location ? (
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

                {/* ORDER */}

                {coffee?.order_name ? (
                  <View
                    style={
                      styles.orderCard
                    }
                  >
                    <Text
                      style={
                        styles.orderLabel
                      }
                    >
                      WHAT YOU ORDERED
                    </Text>

                    <Text
                      style={
                        styles.orderText
                      }
                    >
                      {
                        coffee.order_name
                      }
                    </Text>
                  </View>
                ) : null}

                {/* RATING */}

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
                      {
                        coffee?.rating
                      }
                      /5
                    </Text>
                  </View>
                ) : null}

                {/* THOUGHTS */}

                {coffee?.thoughts ? (
                  <Text
                    style={
                      styles.thoughts
                    }
                  >
                    “
                    {
                      coffee.thoughts
                    }
                    ”
                  </Text>
                ) : null}
              </View>

              {/* COMMENTS HEADER */}

              <View
                style={
                  styles.commentsHeader
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Comments
                </Text>

                <View
                  style={
                    styles.commentCountBadge
                  }
                >
                  <Text
                    style={
                      styles.commentCount
                    }
                  >
                    {
                      comments.length
                    }
                  </Text>
                </View>
              </View>

              {comments.length ===
              0 ? (
                <View
                  style={
                    styles.emptyContainer
                  }
                >
                  <Text
                    style={
                      styles.emptyEmoji
                    }
                  >
                    💬
                  </Text>

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No comments yet
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Be the first to
                    share something.
                  </Text>
                </View>
              ) : null}
            </>
          }
          renderItem={({
            item,
          }) => (
            <Pressable
              style={
                styles.commentCard
              }
              onLongPress={() =>
                handleDeleteComment(
                  item
                )
              }
            >
              <View
                style={
                  styles.commentAvatar
                }
              >
                <Text
                  style={
                    styles.commentAvatarText
                  }
                >
                  {item.user_name
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>

              <View
                style={
                  styles.commentContent
                }
              >
                <Text
                  style={
                    styles.commentUserName
                  }
                >
                  {
                    item.user_name
                  }
                </Text>

                <Text
                  style={
                    styles.commentText
                  }
                >
                  {item.comment}
                </Text>

                {item.user_id ===
                user?.id ? (
                  <Text
                    style={
                      styles.deleteHint
                    }
                  >
                    Hold to delete
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            <View
              style={
                styles.footerSpace
              }
            />
          }
        />

        {/* ==================================
            COMMENT INPUT
        ================================== */}

        <View
          style={
            styles.inputContainer
          }
        >
          <TextInput
            style={
              styles.input
            }
            placeholder="Write a comment..."
            placeholderTextColor="#A48B7F"
            value={comment}
            onChangeText={
              setComment
            }
            multiline
            maxLength={300}
          />

          <Pressable
            style={[
              styles.sendButton,

              (!comment.trim() ||
                sending) &&
                styles.sendButtonDisabled,
            ]}
            onPress={
              handleAddComment
            }
            disabled={
              !comment.trim() ||
              sending
            }
          >
            <Text
              style={
                styles.sendText
              }
            >
              {sending
                ? "..."
                : "Send"}
            </Text>
          </Pressable>
        </View>
      </View>
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

    loadingContainer: {
      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

      backgroundColor:
        "#FFF9F5",
    },

    page: {
      flex: 1,

      width: "100%",

      maxWidth:
        layout.contentMaxWidth,

      alignSelf: "center",

      backgroundColor:
        "#FFF9F5",

      paddingTop: 54,
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

      fontWeight: "700",

      color: "#6F4E37",
    },

    // ======================================
    // LIST
    // ======================================

    listContent: {
      paddingBottom: 20,
    },

    // ======================================
    // USER
    // ======================================

    userHeader: {
      flexDirection: "row",

      alignItems: "center",

      marginBottom: 14,
    },

    avatar: {
      width: 44,

      height: 44,

      borderRadius: 22,

      backgroundColor:
        "#6F4E37",

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    avatarText: {
      color: "#FFFFFF",

      fontSize: 17,

      fontWeight: "700",
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

    metaRow: {
      flexDirection: "row",

      alignItems:
        "center",

      marginTop: 3,
    },

    metaText: {
      fontSize: 12,

      color: "#9A8175",
    },

    metaDot: {
      fontSize: 12,

      color: "#B9A49A",

      marginHorizontal: 5,
    },

    // ======================================
    // IMAGE
    // ======================================

    heroImage: {
      width: "100%",

      borderRadius: 22,

      backgroundColor:
        "#F3E9E3",
    },

    noImage: {
      width: "100%",

      borderRadius: 22,

      backgroundColor:
        "#F1E4DC",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    noImageEmoji: {
      fontSize: 42,
    },

    noImageText: {
      color: "#8A6F63",

      fontSize: 13,

      marginTop: 6,
    },

    // ======================================
    // DETAILS
    // ======================================

    detailsCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius: 22,

      borderWidth: 1,

      borderColor:
        "#EFE3DC",

      padding: 20,

      marginTop: 16,
    },

    title: {
      fontSize: 28,

      fontWeight: "800",

      color: "#3B241C",

      letterSpacing: -0.4,
    },

    titleSmall: {
      fontSize: 24,
    },

    titleDesktop: {
      fontSize: 32,
    },

    locationRow: {
      flexDirection: "row",

      alignItems:
        "flex-start",

      marginTop: 10,
    },

    locationIcon: {
      fontSize: 15,

      marginRight: 6,

      marginTop: 1,
    },

    locationText: {
      flex: 1,

      fontSize: 14,

      lineHeight: 20,

      color: "#8A6F63",
    },

    // ======================================
    // ORDER
    // ======================================

    orderCard: {
      alignSelf:
        "flex-start",

      maxWidth: "100%",

      marginTop: 16,

      backgroundColor:
        "#F7EFEA",

      borderRadius: 14,

      paddingHorizontal: 14,

      paddingVertical: 10,
    },

    orderLabel: {
      fontSize: 9,

      fontWeight: "800",

      color: "#A18476",

      letterSpacing: 1.2,
    },

    orderText: {
      fontSize: 16,

      fontWeight: "700",

      color: "#6F4E37",

      marginTop: 3,

      flexShrink: 1,
    },

    // ======================================
    // RATING
    // ======================================

    ratingRow: {
      flexDirection: "row",

      alignItems:
        "center",

      flexWrap: "wrap",

      marginTop: 16,
    },

    ratingStars: {
      fontSize: 20,

      color: "#D99A32",

      letterSpacing: 1,
    },

    ratingNumber: {
      fontSize: 13,

      fontWeight: "600",

      color: "#9A8175",

      marginLeft: 9,
    },

    // ======================================
    // THOUGHTS
    // ======================================

    thoughts: {
      fontSize: 16,

      color: "#76594F",

      lineHeight: 23,

      marginTop: 16,

      fontStyle: "italic",
    },

    // ======================================
    // COMMENTS
    // ======================================

    commentsHeader: {
      flexDirection: "row",

      alignItems:
        "center",

      marginTop: 28,

      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 21,

      fontWeight: "800",

      color: "#3B241C",
    },

    commentCountBadge: {
      minWidth: 28,

      height: 28,

      borderRadius: 14,

      backgroundColor:
        "#E8DDD7",

      justifyContent:
        "center",

      alignItems:
        "center",

      marginLeft: 9,

      paddingHorizontal: 7,
    },

    commentCount: {
      fontSize: 12,

      fontWeight: "800",

      color: "#6F4E37",
    },

    // ======================================
    // COMMENT CARD
    // ======================================

    commentCard: {
      flexDirection: "row",

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#F0E6E0",

      borderRadius: 17,

      padding: 14,

      marginBottom: 10,
    },

    commentAvatar: {
      width: 40,

      height: 40,

      borderRadius: 20,

      backgroundColor:
        "#6F4E37",

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    commentAvatarText: {
      color: "#FFFFFF",

      fontSize: 16,

      fontWeight: "700",
    },

    commentContent: {
      flex: 1,

      marginLeft: 12,
    },

    commentUserName: {
      fontSize: 14,

      fontWeight: "700",

      color: "#3B241C",
    },

    commentText: {
      fontSize: 15,

      color: "#76594F",

      marginTop: 4,

      lineHeight: 20,
    },

    deleteHint: {
      fontSize: 11,

      color: "#A48B7F",

      marginTop: 6,
    },

    // ======================================
    // EMPTY
    // ======================================

    emptyContainer: {
      alignItems:
        "center",

      paddingVertical: 34,
    },

    emptyEmoji: {
      fontSize: 38,
    },

    emptyTitle: {
      fontSize: 18,

      fontWeight: "700",

      color: "#3B241C",

      marginTop: 10,
    },

    emptyText: {
      fontSize: 14,

      color: "#76594F",

      marginTop: 5,
    },

    // ======================================
    // INPUT
    // ======================================

    inputContainer: {
      flexDirection: "row",

      alignItems:
        "flex-end",

      gap: 10,

      paddingTop: 10,

      paddingBottom:
        Platform.OS ===
        "ios"
          ? 18
          : 12,

      backgroundColor:
        "#FFF9F5",
    },

    input: {
      flex: 1,

      maxHeight: 100,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#E8DDD7",

      borderRadius: 22,

      paddingHorizontal: 16,

      paddingVertical: 11,

      color: "#3B241C",

      fontSize: 15,
    },

    sendButton: {
      backgroundColor:
        "#6F4E37",

      borderRadius: 22,

      paddingHorizontal: 18,

      paddingVertical: 12,
    },

    sendButtonDisabled: {
      opacity: 0.5,
    },

    sendText: {
      color: "#FFFFFF",

      fontWeight: "700",
    },

    footerSpace: {
      height: 12,
    },
  });