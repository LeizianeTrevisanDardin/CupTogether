import {
  useMemo,
  useState,
} from "react";

import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { CoffeeCard } from "@/components/CoffeeCard";
import { useCoffee } from "@/context/CoffeeContext";

export default function ExploreScreen() {
  const { coffees } = useCoffee();

  const { width } =
    useWindowDimensions();

  const isSmallMobile =
    width < 380;

  const isTablet =
    width >= 768;

  const isDesktop =
    width >= 1024;

  const [search, setSearch] =
    useState("");

  const filteredCoffees =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return coffees;
      }

      return coffees.filter(
        (coffee) => {
          const coffeeShop =
            coffee.coffeeShop
              .toLowerCase();

          const userName =
            coffee.userName
              .toLowerCase();

          const order =
            coffee.order
              .toLowerCase();

          return (
            coffeeShop.includes(
              normalizedSearch
            ) ||
            userName.includes(
              normalizedSearch
            ) ||
            order.includes(
              normalizedSearch
            )
          );
        }
      );
    }, [coffees, search]);

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
        {/* HEADER */}

        <Image
        source={require(
          "@/assets/images/CupIconApp.png"
        )}
        style={[
          styles.logo,
          isSmallMobile && styles.logoSmall,
        ]}
        resizeMode="contain"
/>

        <Text
          style={[
            styles.title,

            isSmallMobile &&
              styles.titleSmall,
          ]}
        >
          Explore
        </Text>

        <Text
          style={[
            styles.subtitle,

            isSmallMobile &&
              styles.subtitleSmall,
          ]}
        >
          Discover coffee finds from the CupTogether community.
        </Text>

        {/* SEARCH */}

        <View
          style={[
            styles.searchWrapper,

            isDesktop &&
              styles.searchWrapperDesktop,
          ]}
        >
          <TextInput
            style={
              styles.searchInput
            }
            placeholder="Search coffee shops, drinks or friends..."
            placeholderTextColor="#A48B7F"
            value={search}
            onChangeText={
              setSearch
            }
            autoCapitalize="none"
          />
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Coffee Finds
        </Text>

        {/* RESULTS */}

        {filteredCoffees.length ===
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
              ☕️
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Nothing found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Try searching for another coffee shop or drink.
            </Text>
          </View>
        ) : (
          <FlatList
            data={
              filteredCoffees
            }
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
              <View
                style={[
                  styles.cardWrapper,

                  isDesktop &&
                    styles.cardWrapperDesktop,
                ]}
              >
                <CoffeeCard
                  coffee={item}
                />
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

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
      maxWidth: 1100,
      paddingHorizontal: 32,
      paddingTop: 50,
    },

    // ======================================
    // HEADER
    // ======================================

    logo: {
      width: 58,
      height: 58,
    },

    logoSmall: {
      width: 50,
      height: 50,
    },

    title: {
      fontSize: 30,
      fontWeight: "700",
      color: "#3B241C",
      marginTop: 10,
    },

    titleSmall: {
      fontSize: 27,
    },

    subtitle: {
      fontSize: 15,
      color: "#76594F",
      marginTop: 8,
      marginBottom: 22,
      lineHeight: 22,
    },

    subtitleSmall: {
      fontSize: 14,
      lineHeight: 20,
    },

    // ======================================
    // SEARCH
    // ======================================

    searchWrapper: {
      width: "100%",
      marginBottom: 24,
    },

    searchWrapperDesktop: {
      maxWidth: 720,
    },

    searchInput: {
      width: "100%",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E8DDD7",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: "#3B241C",
    },

    // ======================================
    // SECTION
    // ======================================

    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#3B241C",
      marginBottom: 14,
    },

    // ======================================
    // LIST
    // ======================================

    listContent: {
      paddingBottom: 120,
    },

    cardWrapper: {
      width: "100%",
      alignSelf: "center",
    },

    cardWrapperDesktop: {
      maxWidth: 900,
    },

    // ======================================
    // EMPTY
    // ======================================

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingBottom: 120,
    },

    emptyEmoji: {
      fontSize: 50,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#3B241C",
      marginTop: 12,
    },

    emptyText: {
      fontSize: 15,
      color: "#76594F",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 21,
      maxWidth: 340,
    },
  });