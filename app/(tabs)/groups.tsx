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
  Image,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Group = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  invite_code: string;
};

export default function GroupsScreen() {
  const { user } = useAuth();

  const { width } =
    useWindowDimensions();

  const isSmallMobile =
    width < 380;

  const isTablet =
    width >= 768;

  const isDesktop =
    width >= 1024;

  const [groups, setGroups] =
    useState<Group[]>([]);

  const [groupName, setGroupName] =
    useState("");

  const [joinCode, setJoinCode] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [joining, setJoining] =
    useState(false);

  // ==========================================
  // LOAD GROUPS
  // ==========================================

  const loadGroups =
    useCallback(async () => {
      if (!user) {
        setGroups([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const {
          data,
          error,
        } = await supabase
          .from("group_members")
          .select(`
            group_id,
            groups (
              id,
              name,
              created_by,
              created_at,
              invite_code
            )
          `)
          .eq(
            "user_id",
            user.id
          );

        if (error) {
          throw error;
        }

        const formattedGroups:
          Group[] =
          (data ?? [])
            .map(
              (item: any) =>
                item.groups
            )
            .filter(Boolean);

        setGroups(
          formattedGroups
        );
      } catch (error: any) {
        console.error(
          "Error loading groups:",
          error
        );

        Alert.alert(
          "Groups error",
          error?.message ??
            "Could not load your groups."
        );

        setGroups([]);
      } finally {
        setLoading(false);
      }
    }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  // ==========================================
  // INVITE CODE
  // ==========================================

  const generateInviteCode =
    () => {
      const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

      let code = "";

      for (
        let i = 0;
        i < 6;
        i++
      ) {
        const randomIndex =
          Math.floor(
            Math.random() *
              characters.length
          );

        code +=
          characters[
            randomIndex
          ];
      }

      return code;
    };

  // ==========================================
  // CREATE GROUP
  // ==========================================

  const handleCreateGroup =
    async () => {
      if (!user) {
        Alert.alert(
          "Not signed in",
          "Please sign in before creating a group."
        );

        return;
      }

      if (
        !groupName.trim()
      ) {
        Alert.alert(
          "Missing group name",
          "Please enter a name for your group."
        );

        return;
      }

      try {
        setCreating(true);

        const inviteCode =
          generateInviteCode();

        const {
          data: newGroup,
          error: groupError,
        } = await supabase
          .from("groups")
          .insert({
            name:
              groupName.trim(),

            created_by:
              user.id,

            invite_code:
              inviteCode,
          })
          .select()
          .single();

        if (groupError) {
          throw groupError;
        }

        const {
          error: memberError,
        } = await supabase
          .from(
            "group_members"
          )
          .insert({
            group_id:
              newGroup.id,

            user_id:
              user.id,
          });

        if (memberError) {
          throw memberError;
        }

        setGroupName("");

        await loadGroups();

        Alert.alert(
          "Group created ☕️",
          `${newGroup.name} is ready!\n\nInvite code: ${inviteCode}`
        );
      } catch (error: any) {
        console.error(
          "Error creating group:",
          error
        );

        Alert.alert(
          "Could not create group",
          error?.message ??
            "Something went wrong."
        );
      } finally {
        setCreating(false);
      }
    };

  // ==========================================
  // JOIN GROUP
  // ==========================================

  const handleJoinGroup =
  async () => {
    if (!user) {
      Alert.alert(
        "Not signed in",
        "Please sign in before joining a group."
      );

      return;
    }

    if (!joinCode.trim()) {
      Alert.alert(
        "Missing invite code",
        "Please enter a group invite code."
      );

      return;
    }

    try {
      setJoining(true);

      const formattedCode =
        joinCode
          .trim()
          .toUpperCase();

      const {
        data,
        error,
      } = await supabase.rpc(
        "join_group_by_invite_code",
        {
          p_invite_code:
            formattedCode,
        }
      );

      if (error) {
        throw error;
      }

      const joinedGroup =
        data?.[0];

      setJoinCode("");

      await loadGroups();

      Alert.alert(
        "Welcome to the group",
        joinedGroup?.group_name
          ? `You joined ${joinedGroup.group_name}!`
          : "You joined the group!"
      );
    } catch (error: any) {
      console.error(
        "Error joining group:",
        error
      );

      const message =
        error?.message ??
        "";

      if (
        message.includes(
          "ALREADY_MEMBER"
        )
      ) {
        Alert.alert(
          "Already a member",
          "You are already in this group."
        );

        return;
      }

      if (
        message.includes(
          "INVALID_INVITE_CODE"
        )
      ) {
        Alert.alert(
          "Group not found",
          "Please check the invite code and try again."
        );

        return;
      }

      Alert.alert(
        "Could not join group",
        message ||
          "Please check the invite code."
      );
    } finally {
      setJoining(false);
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
        />
      </View>
    );
  }

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <View
      style={styles.screen}
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
        {/* HEADER */}

        <Text
          style={[
            styles.title,

            isSmallMobile &&
              styles.titleSmall,
          ]}
        >
          My Groups
        </Text>

        <Text
          style={[
            styles.subtitle,

            isSmallMobile &&
              styles.subtitleSmall,
          ]}
        >
          Create a coffee circle and start sharing finds together.
        </Text>

        {/* ======================================
            CREATE + JOIN
        ====================================== */}

        <View
          style={[
            styles.actionsContainer,

            isDesktop &&
              styles.actionsContainerDesktop,
          ]}
        >
          {/* CREATE */}

          <View
            style={[
              styles.actionWrapper,

              isDesktop &&
                styles.actionWrapperDesktop,
            ]}
          >
            <View
              style={
                styles.createCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Create a Group
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="e.g. Coffee Girls"
                placeholderTextColor="#A48B7F"
                value={
                  groupName
                }
                onChangeText={
                  setGroupName
                }
              />

              <Pressable
                style={[
                  styles.createButton,

                  creating &&
                    styles.buttonDisabled,
                ]}
                onPress={
                  handleCreateGroup
                }
                disabled={
                  creating
                }
              >
                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  {creating
                    ? "Creating..."
                    : "Create Group"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* JOIN */}

          <View
            style={[
              styles.actionWrapper,

              isDesktop &&
                styles.actionWrapperDesktop,
            ]}
          >
            <View
              style={
                styles.joinCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Join a Group
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="Enter invite code"
                placeholderTextColor="#A48B7F"
                autoCapitalize="characters"
                value={
                  joinCode
                }
                onChangeText={
                  setJoinCode
                }
              />

              <Pressable
                style={[
                  styles.joinButton,

                  joining &&
                    styles.buttonDisabled,
                ]}
                onPress={
                  handleJoinGroup
                }
                disabled={
                  joining
                }
              >
                <Text
                  style={
                    styles.joinButtonText
                  }
                >
                  {joining
                    ? "Joining..."
                    : "Join Group"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ======================================
            YOUR GROUPS
        ====================================== */}

        <Text
          style={
            styles.groupsTitle
          }
        >
          Your Groups
        </Text>

        {groups.length ===
        0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Image
            source={require("@/assets/images/CupIconApp.png")}
            style={styles.emptyImage}
            resizeMode="contain"
          />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No groups yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Create your first group or join one using an invite code.
            </Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(
              item
            ) => item.id}
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.listContent
            }
            renderItem={({
              item,
            }) => (
              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.groupCard,

                  isDesktop &&
                    styles.groupCardDesktop,

                  pressed &&
                    styles.groupCardPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/group/[id]",

                    params: {
                      id:
                        item.id,
                    },
                  })
                }
              >
                <View
                  style={
                    styles.groupContent
                  }
                >
                  <Text
                    style={
                      styles.groupName
                    }
                  >
                    {item.name}
                  </Text>

                  <Text
                    style={
                      styles.groupInfo
                    }
                  >
                    Invite code:{" "}
                    {
                      item.invite_code
                    }
                  </Text>
                </View>

                <Text
                  style={
                    styles.arrow
                  }
                >
                  ›
                </Text>
              </Pressable>
            )}
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
    // PAGE
    // ======================================

    screen: {
      flex: 1,
      backgroundColor:
        "#FFF9F5",
      alignItems: "center",
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "#FFF9F5",
    },

    container: {
      flex: 1,
      width: "100%",
      paddingHorizontal: 24,
      paddingTop: 60,
    },

    containerSmall: {
      paddingHorizontal: 18,
      paddingTop: 50,
    },

    containerTablet: {
      maxWidth: 850,
    },

    containerDesktop: {
      maxWidth: 1050,
      paddingHorizontal: 32,
      paddingTop: 50,
    },

    // ======================================
    // HEADER
    // ======================================

    title: {
      fontSize: 30,
      fontWeight: "700",
      color: "#3B241C",
    },

    titleSmall: {
      fontSize: 27,
    },

    subtitle: {
      fontSize: 15,
      color: "#76594F",
      marginTop: 8,
      marginBottom: 24,
      lineHeight: 22,
    },

    subtitleSmall: {
      fontSize: 14,
      lineHeight: 20,
    },

    // ======================================
    // CREATE + JOIN AREA
    // ======================================

    actionsContainer: {
      width: "100%",
      gap: 16,
    },

    actionsContainerDesktop: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 20,
    },

    actionWrapper: {
      width: "100%",
    },

    actionWrapperDesktop: {
      flex: 1,
      width: undefined,
    },

    createCard: {
      width: "100%",

      backgroundColor: "#FFFFFF",

      borderWidth: 1,
      borderColor: "#F0E6E0",

      borderRadius: 20,

      padding: 18,
    },

    joinCard: {
      width: "100%",

      backgroundColor: "#FFFFFF",

      borderWidth: 1,
      borderColor: "#F0E6E0",

      borderRadius: 20,

      padding: 18,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#3B241C",
      marginBottom: 12,
    },

    input: {
      width: "100%",
      minHeight: 50,
      backgroundColor:
        "#FFF9F5",
      borderWidth: 1,
      borderColor:
        "#E8DDD7",
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: "#3B241C",
    },

    // ======================================
    // BUTTONS
    // ======================================

    createButton: {
      backgroundColor:
        "#6F4E37",
      minHeight: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent:
        "center",
      marginTop: 14,
    },

    createButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },

    joinButton: {
      backgroundColor: "#6F4E37",
      minHeight: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
    },

    joinButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    // ======================================
    // YOUR GROUPS
    // ======================================

    groupsTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#3B241C",
      marginTop: 28,
      marginBottom: 12,
    },

    listContent: {
      paddingBottom: 120,
    },

    groupCard: {
      width: "100%",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#F0E6E0",
      borderRadius: 18,
      padding: 18,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    groupCardDesktop: {
      minHeight: 78,
      paddingHorizontal: 22,
    },

    groupCardPressed: {
      backgroundColor:
        "#FFFDFC",
    },

    groupContent: {
      flex: 1,
    },

    groupName: {
      fontSize: 18,
      fontWeight: "700",
      color: "#3B241C",
    },

    groupInfo: {
      fontSize: 14,
      color: "#A48B7F",
      marginTop: 4,
    },

    arrow: {
      fontSize: 30,
      color: "#A48B7F",
      marginLeft: 10,
    },

    // ======================================
    // EMPTY
    // ======================================

    emptyContainer: {
      alignItems: "center",
      paddingVertical: 40,
    },

   emptyImage: {
      width: 80,
      height: 80,
      marginBottom: 16,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#3B241C",
      marginTop: 12,
    },

    emptyText: {
      color: "#76594F",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 21,
      maxWidth: 340,
    },
  });