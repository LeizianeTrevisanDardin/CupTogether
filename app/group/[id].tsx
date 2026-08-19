import {
  useEffect,
  useMemo,
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

import * as ImagePicker from "expo-image-picker";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { CoffeeCard } from "@/components/CoffeeCard";

import { useAuth } from "@/context/AuthContext";
import { useCoffee } from "@/context/CoffeeContext";

import { supabase } from "@/lib/supabase";

// ==========================================
// TYPES
// ==========================================

type Group = {
  id: string;
  name: string;
  created_by: string;
  invite_code: string | null;
  avatar_url: string | null;
};

type Member = {
  user_id: string;
  name: string;
  avatar_url: string | null;
};

// ==========================================
// SCREEN
// ==========================================

export default function GroupDetailsScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const { user } =
    useAuth();

  const {
    coffees,
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

  const [
    group,
    setGroup,
  ] =
    useState<Group | null>(
      null
    );

  const [
    members,
    setMembers,
  ] =
    useState<Member[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    updatingPhoto,
    setUpdatingPhoto,
  ] =
    useState(false);

  const [
    sharedCoffeeIds,
    setSharedCoffeeIds,
  ] =
    useState<string[]>([]);

  // ==========================================
  // GROUP COFFEES
  // ==========================================

  const groupCoffees =
    useMemo(() => {
      if (!group) {
        return [];
      }

      const sharedIds =
        new Set(
          sharedCoffeeIds
        );

      return coffees.filter(
        (coffee) =>
          coffee.groupId ===
            group.id ||
          sharedIds.has(
            coffee.id
          )
      );
    }, [
      coffees,
      group,
      sharedCoffeeIds,
    ]);

  // ==========================================
  // LOAD GROUP
  // ==========================================

  useEffect(() => {
    const loadGroup =
      async () => {
        if (!id) {
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          // ----------------------------------
          // LOAD GROUP
          // ----------------------------------

          const {
            data: groupData,
            error: groupError,
          } =
            await supabase
              .from("groups")
              .select(`
                id,
                name,
                created_by,
                invite_code,
                avatar_url
              `)
              .eq(
                "id",
                id
              )
              .single();

          if (groupError) {
            throw groupError;
          }

          setGroup(
            groupData
          );

          // ----------------------------------
          // LOAD SHARED COFFEE FINDS
          // ----------------------------------

          const {
            data: shareRows,
            error: sharesError,
          } =
            await supabase
              .from(
                "coffee_group_shares"
              )
              .select(
                "coffee_id"
              )
              .eq(
                "group_id",
                id
              );

          if (sharesError) {
            throw sharesError;
          }

          const sharedIds =
            (
              shareRows ?? []
            )
              .map(
                (share) =>
                  share.coffee_id
              )
              .filter(
                (
                  coffeeId
                ): coffeeId is string =>
                  Boolean(
                    coffeeId
                  )
              );

          setSharedCoffeeIds(
            sharedIds
          );

          // ----------------------------------
          // LOAD MEMBERS
          // ----------------------------------

          const {
            data: memberRows,
            error:
              membersError,
          } =
            await supabase
              .from(
                "group_members"
              )
              .select(
                "user_id"
              )
              .eq(
                "group_id",
                id
              );

          if (
            membersError
          ) {
            throw membersError;
          }

          const userIds =
            (
              memberRows ?? []
            ).map(
              (member) =>
                member.user_id
            );

          if (
            userIds.length ===
            0
          ) {
            setMembers(
              []
            );

            return;
          }

          // ----------------------------------
          // LOAD MEMBER PROFILES
          // ----------------------------------

          const {
            data:
              profileData,
            error:
              profilesError,
          } =
            await supabase
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

          const formattedMembers:
            Member[] =
            (
              profileData ?? []
            ).map(
              (profile) => ({
                user_id:
                  profile.id,

                name:
                  profile.name ??
                  "Coffee Friend",

                avatar_url:
                  profile.avatar_url ??
                  null,
              })
            );

          setMembers(
            formattedMembers
          );

          // ----------------------------------
          // REFRESH COFFEES
          // ----------------------------------

          await loadCoffees();
        } catch (
          error: any
        ) {
          console.error(
            "Error loading group:",
            error
          );

          Alert.alert(
            "Group error",
            error?.message ??
              "Could not load this group."
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    loadGroup();
  }, [id, loadCoffees]);

  // ==========================================
  // CHANGE GROUP PHOTO
  // ==========================================

  const handleChangeGroupAvatar =
    async () => {
      if (
        !group ||
        !user
      ) {
        return;
      }

      if (
        user.id !==
        group.created_by
      ) {
        Alert.alert(
          "Not allowed",
          "Only the group creator can change the group photo."
        );

        return;
      }

      try {
        setUpdatingPhoto(
          true
        );

        // ----------------------------------
        // PHOTO PERMISSION
        // ----------------------------------

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

        // ----------------------------------
        // PICK PHOTO
        // ----------------------------------

        const result =
          await ImagePicker
            .launchImageLibraryAsync({
              mediaTypes: [
                "images",
              ],

              allowsEditing:
                true,

              aspect: [
                1,
                1,
              ],

              quality: 0.8,
            });

        if (
          result.canceled
        ) {
          return;
        }

        const image =
          result.assets[0];

        // ----------------------------------
        // CONVERT IMAGE
        // ----------------------------------

        const response =
          await fetch(
            image.uri
          );

        const arrayBuffer =
          await response
            .arrayBuffer();

        const mimeType =
          image.mimeType ??
          "image/jpeg";

        const extension =
          mimeType ===
          "image/png"
            ? "png"
            : mimeType ===
              "image/webp"
            ? "webp"
            : "jpg";

        // ----------------------------------
        // UNIQUE FILE PATH
        // ----------------------------------

        const timestamp =
          Date.now();

        const filePath =
          `${group.id}/avatar-${timestamp}.${extension}`;

        // ----------------------------------
        // UPLOAD
        // ----------------------------------

        const {
          error:
            uploadError,
        } =
          await supabase
            .storage
            .from(
              "group-avatars"
            )
            .upload(
              filePath,
              arrayBuffer,
              {
                contentType:
                  mimeType,

                upsert:
                  false,
              }
            );

        if (
          uploadError
        ) {
          throw uploadError;
        }

        // ----------------------------------
        // GET PUBLIC URL
        // ----------------------------------

        const {
          data:
            publicUrlData,
        } =
          supabase.storage
            .from(
              "group-avatars"
            )
            .getPublicUrl(
              filePath
            );

        const newAvatarUrl =
          publicUrlData
            .publicUrl;

        // ----------------------------------
        // UPDATE GROUP
        // ----------------------------------

        const {
          error:
            updateError,
        } =
          await supabase
            .from("groups")
            .update({
              avatar_url:
                newAvatarUrl,
            })
            .eq(
              "id",
              group.id
            )
            .eq(
              "created_by",
              user.id
            );

        if (
          updateError
        ) {
          throw updateError;
        }

        // ----------------------------------
        // UPDATE SCREEN
        // ----------------------------------

        setGroup(
          (
            currentGroup
          ) => {
            if (
              !currentGroup
            ) {
              return currentGroup;
            }

            return {
              ...currentGroup,

              avatar_url:
                newAvatarUrl,
            };
          }
        );

        Alert.alert(
          "Group photo updated",
          "Your group photo was changed."
        );
      } catch (
        error: any
      ) {
        console.error(
          "Error changing group avatar:",
          error
        );

        Alert.alert(
          "Could not update photo",
          error?.message ??
            "Something went wrong."
        );
      } finally {
        setUpdatingPhoto(
          false
        );
      }
    };

  // ==========================================
  // DELETE GROUP
  // ==========================================

  const handleDeleteGroup =
    () => {
      if (
        !group ||
        !user
      ) {
        return;
      }

      Alert.alert(
        "Delete Group",
        `Are you sure you want to delete "${group.name}"?`,
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Delete",

            style:
              "destructive",

            onPress:
              deleteGroup,
          },
        ]
      );
    };

  const deleteGroup =
    async () => {
      if (
        !group ||
        !user
      ) {
        return;
      }

      try {
        setDeleting(
          true
        );

        const {
          error,
        } =
          await supabase
            .from("groups")
            .delete()
            .eq(
              "id",
              group.id
            )
            .eq(
              "created_by",
              user.id
            );

        if (error) {
          throw error;
        }

        Alert.alert(
          "Group deleted",
          `${group.name} was deleted.`
        );

        router.back();
      } catch (
        error: any
      ) {
        console.error(
          "Error deleting group:",
          error
        );

        Alert.alert(
          "Could not delete group",
          error?.message ??
            "Something went wrong."
        );
      } finally {
        setDeleting(
          false
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
          Loading group...
        </Text>
      </View>
    );
  }

  const isCreator =
    user?.id ===
    group?.created_by;

  const handleCoffeeRemovedFromGroup = (
  coffeeId: string,
  groupId: string
) => {
  if (
    groupId !== group?.id
  ) {
    return;
  }

  setSharedCoffeeIds(
    (current) =>
      current.filter(
        (id) =>
          id !== coffeeId
      )
  );
};

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <View style={styles.screen}>
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
          {/* ======================================
              BACK
          ====================================== */}

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
                styles.backButtonText
              }
            >
              ‹ Back
            </Text>
          </Pressable>

          {/* ======================================
              GROUP AVATAR
          ====================================== */}

          <View
            style={
              styles.groupAvatarSection
            }
          >
            {group?.avatar_url ? (
              <Image
                source={{
                  uri:
                    group.avatar_url,
                }}
                style={[
                  styles.groupAvatar,

                  isSmallMobile &&
                    styles.groupAvatarSmall,
                ]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.groupAvatarPlaceholder,

                  isSmallMobile &&
                    styles.groupAvatarSmall,
                ]}
              >
                <Image
                  source={require(
                    "@/assets/images/PeopleLogo.png"
                  )}
                  style={[
                    styles.groupPlaceholderLogo,

                    isSmallMobile &&
                      styles.groupPlaceholderLogoSmall,
                  ]}
                  resizeMode="contain"
                />
              </View>
            )}

            {isCreator ? (
              <Pressable
                style={
                  styles.changePhotoButton
                }
                onPress={
                  handleChangeGroupAvatar
                }
                disabled={
                  updatingPhoto
                }
              >
                <Text
                  style={
                    styles.changePhotoText
                  }
                >
                  {updatingPhoto
                    ? "Updating Photo..."
                    : "Change Group Photo"}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* ======================================
              GROUP INFO
          ====================================== */}

          <Text
            style={[
              styles.title,

              isSmallMobile &&
                styles.titleSmall,
            ]}
          >
            {group?.name ??
              "Coffee Group"}
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Coffee tastes better together.
          </Text>

          {/* ======================================
              INVITE CODE
          ====================================== */}

          {group?.invite_code ? (
            <View
              style={
                styles.inviteCard
              }
            >
              <Text
                style={
                  styles.inviteLabel
                }
              >
                Invite Code
              </Text>

              <Text
                style={[
                  styles.inviteCode,

                  isSmallMobile &&
                    styles.inviteCodeSmall,
                ]}
              >
                {
                  group.invite_code
                }
              </Text>
            </View>
          ) : null}

          {/* ======================================
              MEMBERS
          ====================================== */}

          <View
            style={
              styles.sectionHeader
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Members
            </Text>

            <Text
              style={
                styles.memberCount
              }
            >
              {members.length}
            </Text>
          </View>

          {members.length ===
          0 ? (
            <View
              style={
                styles.emptyMembersContainer
              }
            >
              <Image
                source={require(
                  "@/assets/images/PeopleLogo.png"
                )}
                style={
                  styles.emptyPeopleLogo
                }
                resizeMode="contain"
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                No members found.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.memberList
              }
            >
              {members.map(
                (item) => (
                  <View
                    key={
                      item.user_id
                    }
                    style={
                      styles.memberCard
                    }
                  >
                    {item.avatar_url ? (
                      <Image
                        source={{
                          uri:
                            item.avatar_url,
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
                          {item.name
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <Text
                      style={
                        styles.memberName
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {item.name}
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          {/* ======================================
              COFFEE FINDS
          ====================================== */}

          <View
            style={
              styles.coffeeSection
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Coffee Finds
              </Text>

              <Text
                style={
                  styles.memberCount
                }
              >
                {
                  groupCoffees.length
                }
              </Text>
            </View>

            {groupCoffees.length ===
            0 ? (
              <View
                style={
                  styles.emptyCoffeeContainer
                }
              >
                <Image
                  source={require(
                    "@/assets/images/CupIconApp.png"
                  )}
                  style={
                    styles.emptyCoffeeLogo
                  }
                  resizeMode="contain"
                />

                <Text
                  style={
                    styles.emptyCoffeeTitle
                  }
                >
                  No Coffee Finds yet
                </Text>

                <Text
                  style={
                    styles.emptyCoffeeText
                  }
                >
                  Share a Coffee Find with{" "}
                  {group?.name ??
                    "this group"}{" "}
                  and it will appear here.
                </Text>

                <Pressable
                  style={
                    styles.addCoffeeButton
                  }
                  onPress={() =>
                    router.push(
                      "/(tabs)/add-coffee"
                    )
                  }
                >
                  <Text
                    style={
                      styles.addCoffeeButtonText
                    }
                  >
                    + Add Coffee
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View
                style={
                  styles.coffeeList
                }
              >
                {groupCoffees.map(
                  (coffee) => (
                    <View
                      key={
                        coffee.id
                      }
                      style={
                        styles.coffeeCardWrapper
                      }
                    >
                     <CoffeeCard
                        coffee={coffee}
                        currentGroupId={
                          group?.id ?? undefined
                        }
                        onRemovedFromGroup={
                          handleCoffeeRemovedFromGroup
                        }
                      />
                      
                    </View>
                  )
                )}
              </View>
            )}
          </View>

          {/* ======================================
              DELETE GROUP
          ====================================== */}

          {isCreator ? (
            <Pressable
              style={[
                styles.deleteButton,

                deleting &&
                  styles.deleteButtonDisabled,
              ]}
              onPress={
                handleDeleteGroup
              }
              disabled={
                deleting
              }
            >
              <Text
                style={
                  styles.deleteButtonText
                }
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Group"}
              </Text>
            </Pressable>
          ) : null}
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
      width: 80,
      height: 80,
    },

    loadingIndicator: {
      marginTop: 14,
    },

    loadingText: {
      marginTop: 10,

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

      paddingBottom:
        50,
    },

    container: {
      width: "100%",

      paddingHorizontal:
        24,

      paddingTop: 60,

      paddingBottom:
        30,
    },

    containerSmall: {
      paddingHorizontal:
        18,

      paddingTop: 48,
    },

    containerTablet: {
      maxWidth: 850,
    },

    containerDesktop: {
      maxWidth: 900,

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

    backButtonText: {
      fontSize: 17,

      fontWeight:
        "600",

      color:
        "#6F4E37",
    },

    // ======================================
    // GROUP AVATAR
    // ======================================

    groupAvatarSection: {
      alignItems:
        "flex-start",

      marginBottom: 8,
    },

    groupAvatar: {
      width: 110,

      height: 110,

      borderRadius: 55,

      backgroundColor:
        "#E8DDD7",
    },

    groupAvatarSmall: {
      width: 90,

      height: 90,

      borderRadius: 45,
    },

    groupAvatarPlaceholder: {
      width: 110,

      height: 110,

      borderRadius: 55,

      backgroundColor:
        "#F1E4DC",

      justifyContent:
        "center",

      alignItems:
        "center",

      overflow:
        "hidden",
    },

    groupPlaceholderLogo: {
      width: 72,

      height: 72,
    },

    groupPlaceholderLogoSmall: {
      width: 58,

      height: 58,
    },

    changePhotoButton: {
      marginTop: 10,
    },

    changePhotoText: {
      color:
        "#6F4E37",

      fontSize: 15,

      fontWeight:
        "600",
    },

    // ======================================
    // GROUP INFO
    // ======================================

    title: {
      fontSize: 30,

      fontWeight:
        "700",

      color:
        "#3B241C",

      marginTop: 12,
    },

    titleSmall: {
      fontSize: 27,
    },

    subtitle: {
      fontSize: 15,

      color:
        "#76594F",

      marginTop: 6,

      marginBottom: 22,

      lineHeight: 21,
    },

    // ======================================
    // INVITE
    // ======================================

    inviteCard: {
      width: "100%",

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#F0E6E0",

      borderRadius: 16,

      padding: 16,

      marginBottom: 28,
    },

    inviteLabel: {
      fontSize: 13,

      color:
        "#A48B7F",

      fontWeight:
        "600",
    },

    inviteCode: {
      fontSize: 24,

      fontWeight:
        "700",

      color:
        "#6F4E37",

      letterSpacing: 3,

      marginTop: 4,
    },

    inviteCodeSmall: {
      fontSize: 21,

      letterSpacing: 2,
    },

    // ======================================
    // SECTIONS
    // ======================================

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      marginBottom: 14,
    },

    sectionTitle: {
      fontSize: 19,

      fontWeight:
        "700",

      color:
        "#3B241C",
    },

    memberCount: {
      marginLeft: 8,

      backgroundColor:
        "#E8DDD7",

      color:
        "#6F4E37",

      paddingHorizontal:
        9,

      paddingVertical:
        3,

      borderRadius: 12,

      overflow:
        "hidden",

      fontSize: 13,

      fontWeight:
        "700",
    },

    // ======================================
    // MEMBERS
    // ======================================

    memberList: {
      width: "100%",
    },

    memberCard: {
      width: "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      backgroundColor:
        "#FFFFFF",

      padding: 14,

      borderRadius: 16,

      marginBottom: 10,

      borderWidth: 1,

      borderColor:
        "#F0E6E0",
    },

    avatar: {
      width: 48,

      height: 48,

      borderRadius: 24,

      backgroundColor:
        "#6F4E37",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    avatarImage: {
      width: 48,

      height: 48,

      borderRadius: 24,

      backgroundColor:
        "#E8DDD7",
    },

    avatarText: {
      color:
        "#FFFFFF",

      fontWeight:
        "700",

      fontSize: 18,
    },

    memberName: {
      flex: 1,

      marginLeft: 12,

      fontSize: 16,

      fontWeight:
        "600",

      color:
        "#3B241C",
    },

    emptyMembersContainer: {
      paddingVertical: 30,

      alignItems:
        "center",
    },

    emptyPeopleLogo: {
      width: 48,

      height: 48,

      marginBottom: 10,
    },

    emptyText: {
      color:
        "#76594F",

      fontSize: 15,
    },

    // ======================================
    // COFFEE FINDS
    // ======================================

    coffeeSection: {
      width: "100%",

      marginTop: 30,
    },

    coffeeList: {
      width: "100%",
    },

    coffeeCardWrapper: {
      width: "100%",

      marginBottom: 18,
    },

    emptyCoffeeContainer: {
      width: "100%",

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#F0E6E0",

      borderRadius: 20,

      paddingVertical: 32,

      paddingHorizontal:
        20,

      alignItems:
        "center",
    },

    emptyCoffeeLogo: {
      width: 64,

      height: 64,
    },

    emptyCoffeeTitle: {
      fontSize: 19,

      fontWeight:
        "700",

      color:
        "#3B241C",

      marginTop: 12,
    },

    emptyCoffeeText: {
      fontSize: 14,

      color:
        "#76594F",

      textAlign:
        "center",

      lineHeight: 20,

      marginTop: 7,

      maxWidth: 340,
    },

    addCoffeeButton: {
      backgroundColor:
        "#6F4E37",

      paddingHorizontal:
        22,

      paddingVertical: 12,

      borderRadius: 24,

      marginTop: 18,
    },

    addCoffeeButtonText: {
      color:
        "#FFFFFF",

      fontSize: 14,

      fontWeight:
        "700",
    },

    // ======================================
    // DELETE
    // ======================================

    deleteButton: {
      width: "100%",

      borderWidth: 1,

      borderColor:
        "#B44B4B",

      borderRadius: 30,

      paddingVertical: 14,

      alignItems:
        "center",

      backgroundColor:
        "#FFF9F5",

      marginTop: 30,
    },

    deleteButtonDisabled: {
      opacity: 0.6,
    },

    deleteButtonText: {
      color:
        "#B44B4B",

      fontSize: 16,

      fontWeight:
        "700",
    },
  });